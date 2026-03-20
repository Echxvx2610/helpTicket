const express = require('express')
const app = express()
const port = 3000

app.get('/home', (req, res) => {
    res.send('Hello World.!')
})

app.get('/about', (req, res) => {
    res.send('Hello World.!')
})

app.get('/contact', (req, res) => {
    res.send('Hello World.!')
})

app.listen(port, () => {
    console.log(`....::::: Server running on port ${port} :::::....`)
})
