public class Book
{
    public int BookId { get; set; }
    public string Title { get; set; }
    public string Author { get; set; }
    public string Publisher { get; set; }
    public string ISBN { get; set; }
    public string Category { get; set; }
    public string Classification { get; set; } = "Unclassified"; // Default value to avoid null issues
    public int PageCount { get; set; }
    public decimal Price { get; set; }
}
