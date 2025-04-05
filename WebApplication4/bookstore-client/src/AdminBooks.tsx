import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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

// Initial empty book for the form
const emptyBook: Book = {
  bookId: 0,
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  category: '',
  classification: 'Unclassified',
  pageCount: 0,
  price: 0
};

function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("Title");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState<Book>({ ...emptyBook });
  const [isAdding, setIsAdding] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: string; message: string } | null>(null);

  // Fetch categories for the filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5299/api/books/categories');
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        showAlert('danger', 'Failed to load categories');
      }
    };
    
    fetchCategories();
  }, []);

  const fetchBooks = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5299/api/books', {
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
    } catch (error) {
      console.error("Error fetching books:", error);
      showAlert('danger', 'Failed to load books');
    }
  }, [page, pageSize, sortField, selectedCategory]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const totalPages = Math.ceil(totalItems / pageSize);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1); // Reset to first page when changing category
  };

  // Show alert message
  const showAlert = (type: string, message: string) => {
    setAlertMessage({ type, message });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  // Handle form input changes for new book
  const handleNewBookChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewBook(prev => ({
      ...prev,
      [name]: name === 'pageCount' || name === 'price' 
        ? parseFloat(value) 
        : value
    }));
  };

  // Handle form input changes for editing book
  const handleEditBookChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingBook) return;
    
    const { name, value } = e.target;
    setEditingBook(prev => ({
      ...prev!,
      [name]: name === 'pageCount' || name === 'price' 
        ? parseFloat(value) 
        : value
    }));
  };

  // Add a new book
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5299/api/books', newBook);
      setNewBook({ ...emptyBook });
      setIsAdding(false);
      fetchBooks();
      showAlert('success', 'Book added successfully');
    } catch (error) {
      console.error("Error adding book:", error);
      showAlert('danger', 'Failed to add book');
    }
  };

  // Update a book
  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    
    try {
      await axios.put(`http://localhost:5299/api/books/${editingBook.bookId}`, editingBook);
      setEditingBook(null);
      fetchBooks();
      showAlert('success', 'Book updated successfully');
    } catch (error) {
      console.error("Error updating book:", error);
      showAlert('danger', 'Failed to update book');
    }
  };

  // Delete a book
  const handleDeleteBook = async (bookId: number) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    
    try {
      await axios.delete(`http://localhost:5299/api/books/${bookId}`);
      fetchBooks();
      showAlert('success', 'Book deleted successfully');
    } catch (error) {
      console.error("Error deleting book:", error);
      showAlert('danger', 'Failed to delete book');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingBook(null);
  };

  // Start editing a book
  const handleStartEdit = (book: Book) => {
    setEditingBook({ ...book });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin - Manage Books</h2>
      
      {/* Alert message */}
      {alertMessage && (
        <div className={`alert alert-${alertMessage.type} alert-dismissible fade show`} role="alert">
          {alertMessage.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setAlertMessage(null)}
            aria-label="Close"
          ></button>
        </div>
      )}
      
      {/* Add New Book Button */}
      {!isAdding && !editingBook && (
        <button 
          className="btn btn-primary mb-4"
          onClick={() => setIsAdding(true)}
        >
          Add New Book
        </button>
      )}
      
      {/* Add New Book Form */}
      {isAdding && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Add New Book</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddBook}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="title" className="form-label">Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="title" 
                    name="title"
                    value={newBook.title}
                    onChange={handleNewBookChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="author" className="form-label">Author</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="author" 
                    name="author"
                    value={newBook.author}
                    onChange={handleNewBookChange}
                    required
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="publisher" className="form-label">Publisher</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="publisher" 
                    name="publisher"
                    value={newBook.publisher}
                    onChange={handleNewBookChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="isbn" className="form-label">ISBN</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="isbn" 
                    name="isbn"
                    value={newBook.isbn}
                    onChange={handleNewBookChange}
                    required
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="category" className="form-label">Category</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="category" 
                    name="category"
                    value={newBook.category}
                    onChange={handleNewBookChange}
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="classification" className="form-label">Classification</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="classification" 
                    name="classification"
                    value={newBook.classification}
                    onChange={handleNewBookChange}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label htmlFor="pageCount" className="form-label">Pages</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="pageCount" 
                    name="pageCount"
                    value={newBook.pageCount}
                    onChange={handleNewBookChange}
                    required
                    min="1"
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label htmlFor="price" className="form-label">Price</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="price" 
                    name="price"
                    value={newBook.price}
                    onChange={handleNewBookChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="d-flex justify-content-end">
                <button 
                  type="button" 
                  className="btn btn-secondary me-2"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Add Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Book Form */}
      {editingBook && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Edit Book</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdateBook}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="edit-title" className="form-label">Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="edit-title" 
                    name="title"
                    value={editingBook.title}
                    onChange={handleEditBookChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="edit-author" className="form-label">Author</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="edit-author" 
                    name="author"
                    value={editingBook.author}
                    onChange={handleEditBookChange}
                    required
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="edit-publisher" className="form-label">Publisher</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="edit-publisher" 
                    name="publisher"
                    value={editingBook.publisher}
                    onChange={handleEditBookChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="edit-isbn" className="form-label">ISBN</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="edit-isbn" 
                    name="isbn"
                    value={editingBook.isbn}
                    onChange={handleEditBookChange}
                    required
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="edit-category" className="form-label">Category</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="edit-category" 
                    name="category"
                    value={editingBook.category}
                    onChange={handleEditBookChange}
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="edit-classification" className="form-label">Classification</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="edit-classification" 
                    name="classification"
                    value={editingBook.classification}
                    onChange={handleEditBookChange}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label htmlFor="edit-pageCount" className="form-label">Pages</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="edit-pageCount" 
                    name="pageCount"
                    value={editingBook.pageCount}
                    onChange={handleEditBookChange}
                    required
                    min="1"
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label htmlFor="edit-price" className="form-label">Price</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="edit-price" 
                    name="price"
                    value={editingBook.price}
                    onChange={handleEditBookChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="d-flex justify-content-end">
                <button 
                  type="button" 
                  className="btn btn-secondary me-2"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Update Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Filters and Controls */}
      {!isAdding && !editingBook && (
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
      )}
      
      {/* Books Table */}
      {!isAdding && !editingBook && (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Classification</th>
                  <th>Pages</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.bookId}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.category}</td>
                    <td>{book.classification}</td>
                    <td>{book.pageCount}</td>
                    <td>${book.price.toFixed(2)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleStartEdit(book)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteBook(book.bookId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
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
        </>
      )}
    </div>
  );
}

export default AdminBooks;
