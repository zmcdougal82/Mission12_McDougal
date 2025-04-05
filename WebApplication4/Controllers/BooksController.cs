using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication4.Data;
using WebApplication4.Models;

namespace WebApplication4.Controllers
{
    [Route("api/books")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly BookStoreContext _context;

        public BooksController(BookStoreContext context)
        {
            _context = context;
        }

        // POST: api/books
        // Creates a new book
        [HttpPost]
        public async Task<IActionResult> CreateBook([FromBody] Book book)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBook), new { id = book.BookId }, book);
        }

        // GET: api/books/{id}
        // Gets a specific book by ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBook(int id)
        {
            var book = await _context.Books.FindAsync(id);

            if (book == null)
            {
                return NotFound();
            }

            return Ok(book);
        }

        // PUT: api/books/{id}
        // Updates a specific book
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBook(int id, [FromBody] Book book)
        {
            if (id != book.BookId)
            {
                return BadRequest();
            }

            _context.Entry(book).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BookExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/books/{id}
        // Deletes a specific book
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBook(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null)
            {
                return NotFound();
            }

            _context.Books.Remove(book);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BookExists(int id)
        {
            return _context.Books.Any(e => e.BookId == id);
        }

        // GET: api/books/categories
        // Returns all unique categories for filtering
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Books
                .Select(b => b.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();
            
            return Ok(categories);
        }
        
        // GET: api/Books
        // Query parameters: page (default=1), pageSize (default=5), sortField, sortOrder (asc/desc), category (optional)
        [HttpGet]
        public async Task<IActionResult> GetBooks(int page = 1, int pageSize = 5, string sortField = "Title", string sortOrder = "asc", string? category = null)
        {
            try
            {
                Console.WriteLine("GetBooks API called");
                Console.WriteLine($"Database path: {_context.Database.GetConnectionString()}");
                
                // Debug information about the database
                Console.WriteLine($"Database provider: {_context.Database.ProviderName}");
                Console.WriteLine($"Connection string: {_context.Database.GetConnectionString()}");
                
                // Check if we can connect to the database
                try
                {
                    var canConnect = await _context.Database.CanConnectAsync();
                    Console.WriteLine($"Can connect to database: {canConnect}");
                    
                    if (!canConnect)
                    {
                        return StatusCode(500, "Cannot connect to database");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Database connection error: {ex.Message}");
                    return StatusCode(500, $"Database connection error: {ex.Message}");
                }
                
                var query = _context.Books.AsQueryable();
                
                try
                {
                    // First check if there are any books
                    var count = await query.CountAsync();
                    Console.WriteLine($"Total books in database: {count}");
                    
                    // If no books, seed the database
                    if (count == 0)
                    {
                        Console.WriteLine("No books found, seeding database...");
                        SeedDatabase();
                        // Re-query after seeding
                        query = _context.Books.AsQueryable();
                        count = await query.CountAsync();
                        Console.WriteLine($"After seeding, total books in database: {count}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error checking book count: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    return StatusCode(500, $"Error checking book count: {ex.Message}");
                }
                
                // Apply category filter if provided
                if (!string.IsNullOrEmpty(category) && category != "All")
                {
                    query = query.Where(b => b.Category == category);
                }

                // Apply sorting based on the sortField parameter
                switch (sortField.ToLower())
                {
                    case "title":
                        query = sortOrder.ToLower() == "asc"
                            ? query.OrderBy(b => b.Title)
                            : query.OrderByDescending(b => b.Title);
                        break;
                    case "author":
                        query = sortOrder.ToLower() == "asc"
                            ? query.OrderBy(b => b.Author)
                            : query.OrderByDescending(b => b.Author);
                        break;
                    case "publisher":
                        query = sortOrder.ToLower() == "asc"
                            ? query.OrderBy(b => b.Publisher)
                            : query.OrderByDescending(b => b.Publisher);
                        break;
                    case "isbn":
                        query = sortOrder.ToLower() == "asc"
                            ? query.OrderBy(b => b.ISBN)
                            : query.OrderByDescending(b => b.ISBN);
                        break;
                    case "category":
                        query = sortOrder.ToLower() == "asc"
                            ? query.OrderBy(b => b.Category)
                            : query.OrderByDescending(b => b.Category);
                        break;
                    case "classification":
                        query = sortOrder.ToLower() == "asc"
                            ? query.OrderBy(b => b.Classification)
                            : query.OrderByDescending(b => b.Classification);
                        break;
                    case "pages":
                        query = sortOrder.ToLower() == "asc"
                            ? query.OrderBy(b => b.PageCount)
                            : query.OrderByDescending(b => b.PageCount);
                        break;
                    case "price":
                        // SQLite doesn't support sorting by decimal directly, so we need to convert to double
                        query = sortOrder.ToLower() == "asc"
                            ? query.OrderBy(b => (double)b.Price)
                            : query.OrderByDescending(b => (double)b.Price);
                        break;
                    default:
                        query = sortOrder.ToLower() == "asc"
                            ? query.OrderBy(b => b.Title)
                            : query.OrderByDescending(b => b.Title);
                        break;
                }

                try
                {
                    // Get total count for pagination
                    var totalBooks = await query.CountAsync();
                    Console.WriteLine($"Total books after filtering: {totalBooks}");

                    // Apply pagination
                    var books = await query
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToListAsync();
                    
                    Console.WriteLine($"Returning {books.Count} books");
                    return Ok(new { totalBooks, books });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error retrieving books: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    return StatusCode(500, $"Error retrieving books: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unhandled exception in GetBooks: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"An unexpected error occurred: {ex.Message}");
            }
        }
        
        // Helper method to seed the database if it's empty
        private void SeedDatabase()
        {
            // Add some sample books
            var books = new List<Book>
            {
                new Book
                {
                    Title = "The Great Gatsby",
                    Author = "F. Scott Fitzgerald",
                    Publisher = "Scribner",
                    ISBN = "978-0743273565",
                    Classification = "Fiction",
                    Category = "Classic",
                    PageCount = 180,
                    Price = 12.99m
                },
                new Book
                {
                    Title = "To Kill a Mockingbird",
                    Author = "Harper Lee",
                    Publisher = "HarperCollins",
                    ISBN = "978-0061120084",
                    Classification = "Fiction",
                    Category = "Classic",
                    PageCount = 336,
                    Price = 14.99m
                },
                new Book
                {
                    Title = "1984",
                    Author = "George Orwell",
                    Publisher = "Penguin Books",
                    ISBN = "978-0451524935",
                    Classification = "Fiction",
                    Category = "Dystopian",
                    PageCount = 328,
                    Price = 11.99m
                },
                new Book
                {
                    Title = "The Catcher in the Rye",
                    Author = "J.D. Salinger",
                    Publisher = "Little, Brown and Company",
                    ISBN = "978-0316769488",
                    Classification = "Fiction",
                    Category = "Coming of Age",
                    PageCount = 277,
                    Price = 10.99m
                },
                new Book
                {
                    Title = "Pride and Prejudice",
                    Author = "Jane Austen",
                    Publisher = "Penguin Classics",
                    ISBN = "978-0141439518",
                    Classification = "Fiction",
                    Category = "Romance",
                    PageCount = 432,
                    Price = 9.99m
                }
            };
            
            _context.Books.AddRange(books);
            _context.SaveChanges();
            
            Console.WriteLine($"Seeded database with {books.Count} books");
        }
    }
}
