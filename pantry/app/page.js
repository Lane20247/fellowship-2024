'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { firestore } from '@/firebase'
import { Box, Stack, Typography, Modal, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import { query, getDocs, collection, setDoc, doc, deleteDoc, getDoc } from 'firebase/firestore'
import './globals.css'
import MuiAppBar from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [shoppingList, setShoppingList] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState('')

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      })
    })
    setInventory(inventoryList)
  }

  const updateShoppingList = async () => {
    const snapshot = query(collection(firestore, 'shoppingList'))
    const docs = await getDocs(snapshot)
    const shoppingListItems = []
    docs.forEach((doc) => {
      shoppingListItems.push({
        name: doc.id,
        ...doc.data(),
      })
    })
    setShoppingList(shoppingListItems)
  }

  const addToShoppingList = async (item) => {
    const docRef = doc(collection(firestore, 'shoppingList'), item.toLowerCase())
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      await setDoc(docRef, { quantity: 1 })
      await updateShoppingList()
    }
  }

  const removeFromShoppingList = async (item) => {
    const docRef = doc(collection(firestore, 'shoppingList'), item.toLowerCase())
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      await deleteDoc(docRef)
    }
    await updateShoppingList()
  }

  const addItem = async (item) => {
    if (!item) return
    const docRef = doc(collection(firestore, 'inventory'), item.toLowerCase())
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
    } else {
      await setDoc(docRef, { quantity: 1 })
    }
    await updateInventory()
    await removeFromShoppingList(item)
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item.toLowerCase())
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
        await addToShoppingList(item)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }
    await updateInventory()
  }

  const editItem = async () => {
    const docRef = doc(collection(firestore, 'inventory'), currentItem.toLowerCase())
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const newQuantity = parseInt(itemName)
      if (newQuantity <= 0) {

        await addToShoppingList(currentItem)
        await deleteDoc(docRef)
      } else {

        await setDoc(docRef, { quantity: newQuantity })
      }
    } else {

      await setDoc(docRef, { quantity: parseInt(itemName) })
    }

    await updateInventory()
    handleClose()
  }

  useEffect(() => {
    updateInventory()
    updateShoppingList()
  }, [])

  const handleOpen = (itemName, quantity) => {
    setItemName(quantity !== undefined ? quantity.toString() : '')
    setEditMode(!!itemName)
    setCurrentItem(itemName)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setCurrentItem('')
    setItemName('')
  }

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredShoppingList = shoppingList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
    >
      <AppBar position="absolute" open={open}>
        <Toolbar sx={{ pr: '24px' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ marginRight: '36px', ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            Perfect Pantry Manager
          </Typography>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          transform="translate(-50%, -50%)"
          top="50%"
          left="50%"
        >
          <Typography variant="h6">{editMode ? 'Edit Item' : 'Add Item'}</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant='outlined'
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              type="number"
              label={editMode ? "New Quantity" : "Item Name"}
              inputProps={{ min: 0 }}
            />
            <Button
              variant="outlined"
              onClick={() => {
                if (editMode) {
                  editItem()
                } else {
                  addItem(itemName)
                }
                handleClose()
              }}
            >
              {editMode ? 'Save' : 'Add'}
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Button
        variant="contained"
        onClick={() => handleOpen('', '')}
      >
        Add New Item to Pantry
      </Button>
      <TextField
        variant='outlined'
        placeholder="Search items in pantry..."
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ maxWidth: '800px', marginBottom: 2 }}
      />
      <Box border='1px solid #333' width="800px">
        <Box width="798px" height="100px" bgcolor="#ADD8E6" display="flex" alignItems="center" justifyContent="center">
          <Typography variant='h2' color='#333'>Pantry Items</Typography>
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
                      <Button size="small" variant="contained" color="info" onClick={() => handleOpen(name, quantity)}>Edit</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box border='1px solid #333' width="800px">
        <Box width="798px" height="100px" bgcolor="#FFD700" display="flex" alignItems="center" justifyContent="center">
          <Typography variant='h2' color='#333'>Shopping List</Typography>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredShoppingList.map(({ name }) => (
                <TableRow key={name}>
                  <TableCell component="th" scope="row">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => addItem(name)}
                    >
                      Add to Pantry
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => removeFromShoppingList(name)}
                      sx={{ marginLeft: 2 }}
                    >
                      Remove
                    </Button>
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
