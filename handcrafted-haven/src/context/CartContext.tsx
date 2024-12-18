'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';

// Define the shape of the cart item
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description: string;
}

// Define the state and action types
interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }; // LOAD_CART action

// Reducer function to manage the cart state
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(item => item.productId === action.payload.productId);
      if (existingItemIndex !== -1) {
        const updatedItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        return { items: updatedItems };
      }
      return { items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { items: state.items.filter(item => item.productId !== action.payload) };
    case 'UPDATE_ITEM_QUANTITY':
      return {
        items: state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: Math.max(action.payload.quantity, 1) }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { items: [] };
    case 'LOAD_CART':
      return { items: action.payload };
    default:
      return state;
  }
};

// Create the CartContext
const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
}>({
  state: { items: [] }, 
  dispatch: () => null,
});

// Context provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart items from localStorage on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        dispatch({ type: 'LOAD_CART', payload: JSON.parse(storedCart).items });
      }
      setIsInitialized(true); 
    }
  }, []);

  // Save cart items to localStorage whenever they change, after initialization
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(state));
    }
  }, [state, isInitialized]);

  // Only render children when initialized
  if (!isInitialized) {
    return null; 
  }

  return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>;
};

// Custom hook to use the CartContext
export const useCart = () => useContext(CartContext);

export default CartContext;
