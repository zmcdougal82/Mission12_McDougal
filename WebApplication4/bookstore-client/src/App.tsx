import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

interface Book {
  bookId: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  category: string;
  classification: string;
  pageCount: number;
  price: number;
}

interface CartItem {
  book: Book;
  quantity: number;
}

// Create a Cart context to share cart state across components
const CartContext = React.createContext<{
  cart: CartItem[];
  addToCart: (book: Book) => void;
  updateQuantity: (bookId: number, quantity: number) => void;
  removeFromCart: (bookId: number) => void;
  clearCart: () => void;
  lastViewedPage: number;
  setLastViewedPage: (page: number) => void;
}>({
  cart: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  lastViewedPage: 1,
  setLastViewedPage: () => {},
});

// Cart Provider Component
function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastViewedPage, setLastViewedPage] = useState(1);

  // Add a book to the cart
  const addToCart = (book: Book) => {
    setCart(prevCart => {
      // Check if the book is already in the cart
      const existingItem = prevCart.find(item => item.book.bookId === book.bookId);
      
      if (existingItem) {
        // If the book is already in the cart, increase the quantity
        return prevCart.map(item => 
          item.book.bookId === book.bookId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // If the book is not in the cart, add it with quantity 1
        return [...prevCart, { book, quantity: 1 }];
      }
    });
  };

  // Update the quantity of a book in the cart
  const updateQuantity = (bookId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.book.bookId === bookId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Remove a book from the cart
  const removeFromCart = (bookId: number) => {
    setCart(prevCart => prevCart.filter(item => item.book.bookId !== bookId));
  };

  // Clear the cart
  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      clearCart,
      lastViewedPage,
      setLastViewedPage
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Cart Page Component
function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, lastViewedPage } = React.useContext(CartContext);
  
  // Calculate cart totals
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + (item.book.price * item.quantity), 0);
  
  // If cart is empty, show a message
  if (cart.length === 0) {
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Shopping Cart</h2>
        <button 
          className="btn btn-primary"
          onClick={() => navigate(`/?page=${lastViewedPage}`)}
        >
          Continue Shopping
        </button>
      </div>
        <div className="alert alert-info">
          Your cart is empty. Add some books to get started!
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Shopping Cart</h2>
        <div>
          <button 
            className="btn btn-outline-danger me-2"
            onClick={() => clearCart()}
          >
            Clear Cart
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(`/?page=${lastViewedPage}`)}
          >
            Continue Shopping
          </button>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.book.bookId}>
                  <td>
                    <div>
                      <h5 className="mb-0">{item.book.title}</h5>
                      <small className="text-muted">
                        {item.book.author} | {item.book.category}
                      </small>
                    </div>
                  </td>
                  <td>${item.book.price.toFixed(2)}</td>
                  <td>
                    <div className="input-group" style={{ width: '150px' }}>
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => updateQuantity(item.book.bookId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <input 
                        type="text" 
                        className="form-control text-center" 
                        value={item.quantity}
                        readOnly
                      />
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => updateQuantity(item.book.bookId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>${(item.book.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeFromCart(item.book.bookId)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-end">
                  <strong>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'}):</strong>
                </td>
                <td>
                  <strong>${subtotal.toFixed(2)}</strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          
          <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
            <button 
              className="btn btn-success btn-lg"
              onClick={() => {
                alert('Thank you for your purchase! This would normally proceed to checkout.');
                clearCart();
                navigate('/');
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart Summary Component
function CartSummary() {
  const navigate = useNavigate();
  const { cart, lastViewedPage } = React.useContext(CartContext);
  const [showCart, setShowCart] = useState(false);
  
  // Calculate cart totals
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + (item.book.price * item.quantity), 0);
  
  // If cart is empty, just show a simple button
  if (cart.length === 0) {
    return (
      <div className="cart-summary">
        <button className="btn btn-outline-primary" disabled>
          Cart (0)
        </button>
      </div>
    );
  }
  
  return (
    <div className="cart-summary">
      <button 
        className="btn btn-primary position-relative" 
        onClick={() => setShowCart(!showCart)}
      >
        Cart
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {itemCount}
        </span>
      </button>
      
      {showCart && (
        <div className="card mt-2" style={{ width: '300px', position: 'absolute', right: 0, zIndex: 1000 }}>
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Shopping Cart</h5>
            <button 
              className="btn-close"
              onClick={() => setShowCart(false)}
            ></button>
          </div>
          <div className="card-body">
            {cart.slice(0, 3).map(item => (
              <div key={item.book.bookId} className="d-flex justify-content-between align-items-center mb-2">
                <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <h6 className="mb-0 text-truncate">{item.book.title}</h6>
                  <small className="text-muted">${item.book.price.toFixed(2)} × {item.quantity}</small>
                </div>
                <div>
                  <span className="fw-bold">${(item.book.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
            
            {cart.length > 3 && (
              <div className="text-center mb-2">
                <small className="text-muted">
                  ...and {cart.length - 3} more {cart.length - 3 === 1 ? 'item' : 'items'}
                </small>
              </div>
            )}
            
            <hr />
            <div className="d-flex justify-content-between">
              <h5>Subtotal:</h5>
              <h5>${subtotal.toFixed(2)}</h5>
            </div>
            
            <div className="d-grid gap-2 mt-3">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowCart(false);
                  navigate('/cart');
                }}
              >
                Go to Cart
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setShowCart(false);
                  navigate(`/?page=${lastViewedPage}`);
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Toast Component for notifications
function Toast({ message, show, onClose }: { message: string, show: boolean, onClose: () => void }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <div className={`position-fixed bottom-0 end-0 p-3 ${show ? 'show' : ''}`} style={{ zIndex: 1050 }}>
      <div 
        className={`toast ${show ? 'show' : ''}`} 
        role="alert" 
        aria-live="assertive" 
        aria-atomic="true"
      >
        <div className="toast-header">
          <div className="bg-primary rounded me-2" style={{ width: '20px', height: '20px' }}></div>
          <strong className="me-auto">Bookstore</strong>
          <small>Just now</small>
          <button 
            type="button" 
            className="btn-close" 
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>
        <div className="toast-body">
          {message}
        </div>
      </div>
    </div>
  );
}

// Main BookList Component
function BookList() {
  const navigate = useNavigate();
  const { addToCart, setLastViewedPage } = React.useContext(CartContext);
  const [books, setBooks] = useState<Book[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const { search } = window.location;
  const params = new URLSearchParams(search);
  const pageParam = params.get('page');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [groupByClassification, setGroupByClassification] = useState(false);
  const [expandedClassification, setExpandedClassification] = useState<string | null>(null);
  
  // Initialize page from URL parameter if available
  useEffect(() => {
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        setPage(pageNumber);
      }
    }
  }, [pageParam]);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState("Title");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Fetch categories for the filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Log the request URL for debugging
        console.log('Fetching categories from: /api/books/categories');
        const response = await axios.get('/api/books/categories');
        console.log('Categories response:', response.data);
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Try to get more detailed error information
        if (axios.isAxiosError(error)) {
          console.error("Axios error details:", error.response?.data || error.message);
        }
      }
    };
    
    fetchCategories();
  }, []);

  const fetchBooks = useCallback(async () => {
    try {
      // Use a relative URL since the API is now served from the same origin
      const response = await axios.get('/api/books', {
        params: { 
          page, 
          pageSize, 
          sortField, 
          sortOrder: 'asc',
          category: selectedCategory === "All" ? null : selectedCategory
        },
      });
      setBooks(response.data.books);
      setTotalItems(response.data.totalBooks);
      // Update last viewed page for "Continue Shopping" functionality
      setLastViewedPage(page);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  }, [page, pageSize, sortField, selectedCategory, setLastViewedPage]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const totalPages = Math.ceil(totalItems / pageSize);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1); // Reset to first page when changing category
  };
  
  // Handle adding book to cart with toast notification
  const handleAddToCart = (book: Book) => {
    addToCart(book);
    setToastMessage(`"${book.title}" has been added to your cart!`);
    setShowToast(true);
  };
  
  // Group books by classification
  const booksByClassification = React.useMemo(() => {
    if (!groupByClassification) return null;
    
    return books.reduce<Record<string, Book[]>>((acc, book) => {
      const classification = book.classification || 'Uncategorized';
      if (!acc[classification]) {
        acc[classification] = [];
      }
      acc[classification].push(book);
      return acc;
    }, {});
  }, [books, groupByClassification]);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Book List</h2>
        <CartSummary />
      </div>

      {/* Filters and Controls */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="d-flex align-items-center">
            <label className="me-2">Category:</label>
            <select 
              className="form-select form-select-sm d-inline-block w-auto me-3"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <div className="form-check form-switch">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="groupByClassification"
                checked={groupByClassification}
                onChange={() => setGroupByClassification(!groupByClassification)}
              />
              <label className="form-check-label" htmlFor="groupByClassification">
                Group by Classification
              </label>
            </div>
          </div>
        </div>
        <div className="col-md-8 text-end">
          <label className="me-2">Results per page:</label>
          <select
            className="form-select form-select-sm d-inline-block w-auto me-3"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <label className="me-2">Sort by:</label>
          <select 
            className="form-select form-select-sm d-inline-block w-auto"
            value={sortField} 
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="Title">Title</option>
            <option value="Author">Author</option>
            <option value="Publisher">Publisher</option>
            <option value="ISBN">ISBN</option>
            <option value="Category">Category</option>
            <option value="Classification">Classification</option>
            <option value="Pages">Pages</option>
            <option value="Price">Price</option>
          </select>
        </div>
      </div>

      {/* Books Display - Either Accordion or Table */}
      {groupByClassification && booksByClassification ? (
        <div className="accordion mb-4" id="booksAccordion">
          {Object.entries(booksByClassification).map(([classification, classBooks]) => (
            <div className="accordion-item" key={classification}>
              <h2 className="accordion-header">
                <button 
                  className={`accordion-button ${expandedClassification === classification ? '' : 'collapsed'}`}
                  type="button" 
                  onClick={() => setExpandedClassification(expandedClassification === classification ? null : classification)}
                  aria-expanded={expandedClassification === classification}
                >
                  <span className="fw-bold">{classification}</span>
                  <span className="ms-2 badge bg-secondary rounded-pill">{classBooks.length}</span>
                </button>
              </h2>
              <div 
                className={`accordion-collapse collapse ${expandedClassification === classification ? 'show' : ''}`}
              >
                <div className="accordion-body p-0">
                  <table className="table table-striped mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: '20%' }}>Title</th>
                        <th style={{ width: '15%' }}>Author</th>
                        <th style={{ width: '15%' }}>Publisher</th>
                        <th style={{ width: '10%' }}>Category</th>
                        <th style={{ width: '10%', textAlign: 'right' }}>Pages</th>
                        <th style={{ width: '10%', textAlign: 'right' }}>Price</th>
                        <th style={{ width: '10%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {classBooks.map((book) => (
                        <tr key={book.bookId}>
                          <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</td>
                          <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</td>
                          <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.publisher}</td>
                          <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.category}</td>
                          <td style={{ textAlign: 'right' }}>{book.pageCount}</td>
                          <td style={{ textAlign: 'right' }}>${book.price.toFixed(2)}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleAddToCart(book)}
                            >
                              Add to Cart
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="table table-striped" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Title</th>
              <th style={{ width: '12%' }}>Author</th>
              <th style={{ width: '12%' }}>Publisher</th>
              <th style={{ width: '12%' }}>ISBN</th>
              <th style={{ width: '8%' }}>Category</th>
              <th style={{ width: '8%' }}>Classification</th>
              <th style={{ width: '8%', textAlign: 'right' }}>Pages</th>
              <th style={{ width: '8%', textAlign: 'right' }}>Price</th>
              <th style={{ width: '10%' }}></th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.bookId}>
                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</td>
                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</td>
                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.publisher}</td>
                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.isbn}</td>
                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.category}</td>
                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.classification}</td>
                <td style={{ textAlign: 'right' }}>{book.pageCount}</td>
                <td style={{ textAlign: 'right' }}>${book.price.toFixed(2)}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleAddToCart(book)}
                  >
                    Add to Cart
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {/* Toast notification */}
      <Toast 
        message={toastMessage} 
        show={showToast} 
        onClose={() => setShowToast(false)} 
      />

      {/* Pagination */}
      <nav>
        <ul className="pagination">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(page - 1)}>
              Previous
            </button>
          </li>
          {Array.from({ length: totalPages }, (_, idx) => (
            <li key={idx} className={`page-item ${page === idx + 1 ? 'active' : ''}`}>
              <button className="page-link" onClick={() => setPage(idx + 1)}>
                {idx + 1}
              </button>
            </li>
          ))}
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(page + 1)}>
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

// App Layout Component
function AppLayout() {
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <Link className="navbar-brand" to="/">Bookstore</Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Books</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/cart">Cart</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      
      <Routes>
        <Route path="/" element={<BookList />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <CartProvider>
      <Router>
        <AppLayout />
      </Router>
    </CartProvider>
  );
}

export default App;
