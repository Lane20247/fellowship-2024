'use client'

import { useState, useEffect,useCallback } from 'react'
import { firestore } from '@/firebase'
import {
  Box, Stack, Typography, Modal, TextField, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle
} from '@mui/material'
import { query, getDocs, collection, setDoc, doc, deleteDoc, getDoc } from 'firebase/firestore'
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MenuIcon from '@mui/icons-material/Menu';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import './globals.css'
// import RecipeSuggestion from './RecipeSuggestion';
import { styled, alpha } from '@mui/material/styles';
import KitchenIcon from '@mui/icons-material/Kitchen';
import InputBase from '@mui/material/InputBase';
import { useDropzone } from 'react-dropzone';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


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

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const CustomAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#FFB6C1', // Light pink color
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
}));


export default function Home() {
  const [inventory, setInventory] = useState([])
  const [shoppingList, setShoppingList] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [itemImage, setItemImage] = useState(null);


  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      const data = doc.data();
      console.log('Item data:', data); // Add this line
      inventoryList.push({
        name: doc.id,
        ...data,
      })
    })
    setInventory(inventoryList)
    console.log('Updated inventory:', inventoryList); // Add this line
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
    const docRef = doc(collection(firestore, 'shoppingList'), item.toLowerCase());
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, { quantity: 1, imageUrl: item.imageUrl || null });
      await updateShoppingList();
    }
  };

  const removeFromShoppingList = async (item) => {
    const docRef = doc(collection(firestore, 'shoppingList'), item.toLowerCase())
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      await deleteDoc(docRef)
    }
    await updateShoppingList()
  }

  const addItem = async (itemName, quantity) => {
    if (!itemName) return;
    const docRef = doc(collection(firestore, 'inventory'), itemName.toLowerCase());
    const docSnap = await getDoc(docRef);

    let imageUrl = null;
    if (itemImage) {
      imageUrl = await uploadImage(itemImage);
      console.log('Uploaded image URL:', imageUrl);
    }

    if (docSnap.exists()) {
      const currentQuantity = docSnap.data().quantity;
      await setDoc(docRef, {
        quantity: currentQuantity + (quantity || 1),
        imageUrl: imageUrl || docSnap.data().imageUrl
      });
    } else {
      await setDoc(docRef, {
        quantity: quantity || 1,
        imageUrl: imageUrl
      });
    }
    await updateInventory();
    await removeFromShoppingList(itemName);
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item.toLowerCase())
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        setItemToDelete(item)
        setDeleteConfirmOpen(true)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
        await updateInventory()
      }
    }
  }

  const confirmDelete = async () => {
    if (itemToDelete) {
      const docRef = doc(collection(firestore, 'inventory'), itemToDelete.toLowerCase())
      await deleteDoc(docRef)
      await addToShoppingList(itemToDelete)
      await updateInventory()
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  const editItem = async () => {
    const docRef = doc(collection(firestore, 'inventory'), currentItem.toLowerCase());
    const docSnap = await getDoc(docRef);

    let imageUrl = null;
    if (itemImage) {
      imageUrl = await uploadImage(itemImage);
      console.log('Uploaded image URL:', imageUrl);
    }

    if (docSnap.exists()) {
      const newQuantity = parseInt(itemQuantity);
      if (newQuantity <= 0) {
        await addToShoppingList(currentItem);
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          quantity: newQuantity,
          imageUrl: imageUrl || docSnap.data().imageUrl
        });
      }
    } else {
      await setDoc(docRef, {
        quantity: parseInt(itemQuantity),
        imageUrl: imageUrl
      });
    }

    await updateInventory();
    handleClose();
  };

  const onDrop = useCallback((acceptedFiles) => {
    setItemImage(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: 'image/*', maxFiles: 1 });

  const uploadImage = async (file) => {
    if (!file) return null;
    const storage = getStorage();
    const storageRef = ref(storage, `item-images/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };




  useEffect(() => {
    updateInventory()
    updateShoppingList()
  }, [])

  const handleOpen = (itemName, quantity) => {
    setItemName(itemName || '');
    setItemQuantity(quantity !== undefined ? quantity.toString() : '1');
    setEditMode(!!itemName);
    setCurrentItem(itemName || '');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setCurrentItem('')
    setItemName('')
    setItemImage(null)
  }

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredShoppingList = shoppingList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box className="flex flex-col items-center gap-8 p-8 pt-24 min-h-screen bg-gray-100">
      <CustomAppBar position="fixed" open={open}>
        <Toolbar className="flex justify-between items-center px-4">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            className="mr-4 hover:bg-blue-200 transition-colors duration-200"
            sx={{ ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography component="h1" variant="h5" color="inherit" noWrap className="text-white font-semibold">
            Perfect Pantry Manager
          </Typography>
          <IconButton color="inherit" className="hover:bg-blue-700 transition-colors duration-200">
            <Badge badgeContent={4} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </CustomAppBar>

      <Modal open={open} onClose={handleClose}>
        <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-8 bg-white shadow-xl rounded-lg w-96">
          <Typography variant="h5" className="mb-6 font-semibold">
            {editMode ? 'Edit Item' : 'Add Item'}
          </Typography>
          <Stack direction="column" spacing={3}>
          <TextField
            variant='outlined'
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            type="text"
            label={editMode ? "Item Name" : "Item Name"}
            className="text-gray-700"
          />
          <TextField
            variant='outlined'
            fullWidth
            value={itemQuantity}
            onChange={(e) => setItemQuantity(e.target.value)}
            type="number"
            label="Quantity"
            inputProps={{ min: 0 }}
            className="text-gray-700"
          />
          <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-4 text-center cursor-pointer">
            <input {...getInputProps()} />
            <p>Drag and drop an image here, or click to select one</p>
          </div>
          {itemImage && (
            <p>{itemImage.name} - {itemImage.size} bytes</p>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (editMode) {
                editItem();
              } else {
                addItem(itemName, parseInt(itemQuantity) || 1);
                handleClose();
              }
            }}
          >
            {editMode ? 'Save Changes' : 'Add Item'}
          </Button>
          </Stack>
        </Box>
      </Modal>

      <Dialog
  open={deleteConfirmOpen}
  onClose={() => setDeleteConfirmOpen(false)}
>
  <DialogTitle>Confirm Delete</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete {itemToDelete}?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
        Cancel
      </Button>
      <Button onClick={confirmDelete} color="primary">
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
      <div className="w-full max-w-6xl flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <Typography variant="h3" className="text-gray-800 font-bold">
            Pantry Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpen()}
            className="py-3 px-6 text-lg font-medium shadow-md transition-all duration-200 hover:shadow-lg hover:bg-blue-700"
          >
            Add New Item to Pantry
          </Button>
        </div>
        <TextField
          variant='outlined'
          placeholder="Search items..."
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4 shadow-sm"
          InputProps={{
            startAdornment: (
              <SearchIcon className="text-gray-400 mr-2" />
            ),
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Box className="border border-gray-300 rounded-lg shadow-lg overflow-hidden">
            <Box className="bg-blue-200 text-center p-6">
              <Typography variant='h4' className="text-gray-800 font-semibold">Pantry Items</Typography>
            </Box>
            <TableContainer component={Paper} className="max-h-[500px] overflow-y-auto">
              <Table stickyHeader>
                <TableHead>
                  <TableRow className="bg-gray-100">
                    <TableCell className="font-semibold text-lg">Item</TableCell>
                    <TableCell align="center" className="font-semibold text-lg">Quantity</TableCell>
                    <TableCell align="center" className="font-semibold text-lg">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory.map(({ name, quantity, imageUrl  }) => (
                    <TableRow key={name} className="hover:bg-gray-50 transition-colors duration-150">
                      <TableCell component="th" scope="row" className="capitalize text-lg">
                      <div className="flex items-center">
                        {imageUrl && (
                          <img src={imageUrl} alt={name} className="w-8 h-8 mr-2 object-cover rounded-full" />
                        )}
                        {name}
                      </div>
                      </TableCell>
                      <TableCell align="center" className="text-lg">{quantity}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={2} justifyContent="center">
                          <Tooltip title="Add one">
                            <IconButton
                              color="primary"
                              onClick={() => addItem(name)}
                              className="transition-colors duration-200 hover:bg-blue-100"
                            >
                              <AddIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove one">
                            <IconButton
                              color="error"
                              onClick={() => removeItem(name)}
                              className="transition-colors duration-200 hover:bg-red-100"
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit quantity">
                            <IconButton
                              color="info"
                              onClick={() => handleOpen(name, quantity)}
                              className="transition-colors duration-200 hover:bg-cyan-100"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box className="border border-gray-300 rounded-lg shadow-lg overflow-hidden">
            <Box className="bg-yellow-200 text-center p-6">
              <Typography variant='h4' className="text-gray-800 font-semibold">Shopping List</Typography>
            </Box>
            <TableContainer component={Paper} className="max-h-[500px] overflow-y-auto">
              <Table stickyHeader>
                <TableHead>
                  <TableRow className="bg-gray-100">
                    <TableCell className="font-semibold text-lg">Item</TableCell>
                    <TableCell className="font-semibold text-lg">Quantity</TableCell>
                    <TableCell align="center" className="font-semibold text-lg">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredShoppingList.map(({ name, quantity, imageUrl }) => (
                    <TableRow key={name} className="hover:bg-gray-50 transition-colors duration-150">
                      <TableCell component="th" scope="row" className="capitalize text-lg">
                        <div className="flex items-center">
                        {imageUrl && (
                          <img src={imageUrl} alt={name} className="w-8 h-8 mr-2 object-cover rounded-full" />
                        )}
                        {name}
                      </div>
                      </TableCell>
                      <TableCell>{quantity}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={2} justifyContent="center">
                          <Tooltip title="Add to pantry">
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => addItem(name)}
                              className="px-4 py-2 transition-colors duration-200 hover:bg-green-700"
                              startIcon={<AddShoppingCartIcon />}
                            >
                              Add to Pantry
                            </Button>
                          </Tooltip>
                          <Tooltip title="Remove from list">
                            <IconButton
                              color="error"
                              onClick={() => removeFromShoppingList(name)}
                              className="transition-colors duration-200 hover:bg-red-100"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </div>
        {/* <RecipeSuggestion /> */}
      </div>
    </Box>
  )
};
