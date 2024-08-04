import React, { useState } from 'react';
import { getRecipeSuggestions } from '/Users/lavanyanese/Documents/Repos/fellowship-2024/pantry/openai.js';
import { Button, Typography, Box, TextField } from '@mui/material';

export default function RecipeSuggestion() {
  const [pantryItems, setPantryItems] = useState([]);
  const [recipeSuggestions, setRecipeSuggestions] = useState('');

  // Function to handle recipe suggestion
  const fetchRecipeSuggestions = async () => {
    if (pantryItems.length === 0) return;
    const suggestions = await getRecipeSuggestions(pantryItems);
    setRecipeSuggestions(suggestions);
  };

  // Example of updating pantry items manually
  const handlePantryItemsChange = (e) => {
    setPantryItems(e.target.value.split(',').map(item => item.trim()));
  };

  return (
    <Box className="p-8">
      <Typography variant="h5" className="mb-4">Get Recipe Suggestions</Typography>
      <TextField
        variant="outlined"
        fullWidth
        label="Enter pantry items separated by commas"
        onChange={handlePantryItemsChange}
        className="mb-4"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={fetchRecipeSuggestions}
      >
        Get Recipes
      </Button>
      {recipeSuggestions && (
        <Box className="mt-4">
          <Typography variant="h6">Suggested Recipes:</Typography>
          <Typography variant="body1">{recipeSuggestions}</Typography>
        </Box>
      )}
    </Box>
  );
}
