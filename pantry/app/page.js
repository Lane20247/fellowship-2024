'use client'
import Image from 'next/image'
import {useState, useEffect} from 'react'
import {firestore} from '@/firebase'
import {Box,Stack,Typography,Modal, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper} from '@mui/material'
import {query, getDocs, collection, setDoc, doc, deleteDoc, getDoc} from 'firebase/firestore'
import './globals.css'
// // import { transform } from 'next/dist/build/swc'
// import DashboardIcon from '@mui/icons-material/Dashboard'
// import InventoryIcon from '@mui/icons-material/Inventory'

export default function Home() {
  const [inventory, setInventory]=useState([])
  const [open, setOpen]=useState(false)
  const [itemName, setItemName]=useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const updateInventory= async () => {
    const snapshot = query(collection(firestore,'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc)=>{
      inventoryList.push({
        name: doc.id,
      ...doc.data(),
      })
    })
    setInventory(inventoryList)
  }

  const addItem= async (item) => {
    if (!item) return
    const docRef=doc(collection(firestore,'inventory'), item.toLowerCase())
    const docSnap=await getDoc(docRef)

    if(docSnap.exists()){
      const {quantity} = docSnap.data()
      await setDoc(docRef, {quantity:quantity+1})
    } else {
      await setDoc(docRef, {quantity: 1})
    }
    await updateInventory()
  }

  const removeItem= async (item) => {
    const docRef=doc(collection(firestore,'inventory'), item.toLowerCase())
    const docSnap=await getDoc(docRef)

    if(docSnap.exists()){
      const {quantity} = docSnap.data()
      if (quantity===1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, {quantity:quantity -1})
      }
    }
    await updateInventory()
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen= () => setOpen(true)
  const handleClose= () => setOpen(false)

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box width= "100vw"
    height= "100vh"
    display={'flex'}
    justifyContent={'center'}
    flexDirection={'column'}
    alignItems={'center'}
    gap={2}
    >
      <Modal open={open} close={handleClose}>
        <Box
        position="absolute" top="50%" width={400}
        bgcolor="white"
        border="2px solid #000"
        boxShadow={24}
        p={4}
        display="flex"
        flexDirection="column"
        gap={3}
        // sx={{
        //   transform: 'translate(-50%,-50%)',
        // }}
        transform='translate(-50%,-50%)'
        top="50%"
        left="50%"
        >
          <Typography variant="h6">Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2} >
            <TextField variant ='outlined'
            fullWidth
            value={itemName}
            onChange={(e)=> {
              setItemName(e.target.value)
            }}
            />
            <Button
            variant ="outlined"
            onClick={()=>{
              addItem(itemName)
              setItemName('')
              handleClose()
            }}> Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Button
      variant="contained" onClick={()=>{
        handleOpen()
      }}>
        Add New Item
      </Button>
      <TextField
        variant='outlined'
        placeholder="Search items..."
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ maxWidth: '800px', marginBottom: 2 }}
      />
      <Box border='1px solid #333' width="800px">
        <Box width="798px" height="100px" bgcolor="#ADD8E6"
        display="flex" alignItems="center" justifyContent="center">
          <Typography variant = 'h2'
          color= '#333'>
          Inventory Items
          </Typography>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.map(({ name, quantity }) => (
                <TableRow key={name}>
                  <TableCell component="th" scope="row">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </TableCell>
                  <TableCell align="center">{quantity}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button size="small" variant="contained" onClick={() => addItem(name)}>Add</Button>
                      <Button size="small" variant="contained" color="error" onClick={() => removeItem(name)}>Remove</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
    </Box>
    </Box>



  )
}
