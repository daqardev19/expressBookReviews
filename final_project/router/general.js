const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Unable to register user. Username and password are required." });
  }
  if (!isValid(username)) {
    return res.status(404).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "Customer successfully registered. Now you can login" });
});

// ---------------------------------------------------------------------------
// Data access wrapped in Promises (asynchronous, like a database call)
// ---------------------------------------------------------------------------

const getAllBooks = () => new Promise((resolve) => resolve(books));

const getBookByISBN = (isbn) => new Promise((resolve, reject) => {
  if (books[isbn]) {
    resolve(books[isbn]);
  } else {
    reject({ status: 404, message: `Book with ISBN ${isbn} not found` });
  }
});

const getBooksByAuthor = (author) => new Promise((resolve, reject) => {
  const booksbyauthor = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author.toLowerCase())
    .map((isbn) => ({ isbn, title: books[isbn].title, reviews: books[isbn].reviews }));
  if (booksbyauthor.length > 0) {
    resolve({ booksbyauthor });
  } else {
    reject({ status: 404, message: `No books found by author ${author}` });
  }
});

const getBooksByTitle = (title) => new Promise((resolve, reject) => {
  const booksbytitle = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title.toLowerCase())
    .map((isbn) => ({ isbn, author: books[isbn].author, reviews: books[isbn].reviews }));
  if (booksbytitle.length > 0) {
    resolve({ booksbytitle });
  } else {
    reject({ status: 404, message: `No books found with title ${title}` });
  }
});

// Task 10: Get the book list available in the shop (async/await)
public_users.get('/', async function (req, res) {
  try {
    const allBooks = await getAllBooks();
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving books" });
  }
});

// Task 11: Get book details based on ISBN (Promise callbacks)
public_users.get('/isbn/:isbn', function (req, res) {
  getBookByISBN(req.params.isbn)
    .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
    .catch((err) => res.status(err.status || 500).json({ message: err.message }));
});

// Task 12: Get book details based on author (async/await)
public_users.get('/author/:author', async function (req, res) {
  try {
    const result = await getBooksByAuthor(req.params.author);
    return res.status(200).send(JSON.stringify(result, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// Task 13: Get all books based on title (async/await)
public_users.get('/title/:title', async function (req, res) {
  try {
    const result = await getBooksByTitle(req.params.title);
    return res.status(200).send(JSON.stringify(result, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
  }
  return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
});

// ---------------------------------------------------------------------------
// Tasks 10-13 using Axios: functions that retrieve books from the server
// using async/await and Promise callbacks.
// ---------------------------------------------------------------------------

// Task 10: Get all books using async/await with Axios
const fetchAllBooks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching all books: ${error.message}`);
  }
};

// Task 11: Get book details by ISBN using Promise callbacks with Axios
const fetchBookByISBN = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(`Error fetching book with ISBN ${isbn}: ${error.message}`);
    });
};

// Task 12: Get book details by author using async/await with Axios
const fetchBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching books by author ${author}: ${error.message}`);
  }
};

// Task 13: Get book details by title using async/await with Axios
const fetchBooksByTitle = async (title) => {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching books with title ${title}: ${error.message}`);
  }
};

module.exports.general = public_users;
module.exports.fetchAllBooks = fetchAllBooks;
module.exports.fetchBookByISBN = fetchBookByISBN;
module.exports.fetchBooksByAuthor = fetchBooksByAuthor;
module.exports.fetchBooksByTitle = fetchBooksByTitle;
