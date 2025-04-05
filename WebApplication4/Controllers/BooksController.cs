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
            var query = _context.Books.AsQueryable();
            
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

            // Get total count for pagination
            var totalBooks = await query.CountAsync();

            // Apply pagination
            var books = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { totalBooks, books });
        }
    }
}
