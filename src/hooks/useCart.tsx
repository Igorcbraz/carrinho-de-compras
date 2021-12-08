import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const findProduct = newCart.find(product => product.id === productId);

      if(findProduct){
        const stock = await api.get(`/stock/${productId}`);
        const stockAmount = stock.data.amount;

        if(findProduct.amount + 1 > stockAmount){
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        findProduct.amount += 1;
      } else {
        const product = await api.get(`/products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1
        }

        newCart.push(newProduct);
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const productIndex = newCart.findIndex(product => product.id === productId);

      newCart.splice(productIndex, 1)

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];
      const findProduct = newCart.find(product => product.id === productId);
      const currentAmount = findProduct ? findProduct.amount : 0

      if(currentAmount <= 0){
        return;   
      }
      
      if(findProduct){
        const stock = await api.get(`/stock/${productId}`);
        const stockAmount = stock.data.amount;
        
        findProduct.amount = amount;
      } else {
        toast.error('Produto inexistente');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
