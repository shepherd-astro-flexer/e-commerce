const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const usersRepo = require("./repositories/users.js");

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}))

app.use(cookieSession({
  keys: ["astro.flezo"]
}))

app.route("/signup")
.get((req, res) => {
  res.send(`
    <div>
      This is your cookie: ${req.session.userId}
      <form method="POST">
        <input type="text" name="email" placeholder="email" />
        <input type="text" name="password" placeholder="password" />
        <input type="text" name="passwordConfirmation" placeholder="password confirmation" />
        <button>Sign Up</button>
      </form>
    </div>
  `)
})
.post(async (req, res) => {
  const { email, password, passwordConfirmation } = req.body;

  const checkEmail = await usersRepo.getOneBy({ email });
  console.log(checkEmail);
  if (checkEmail) {
    return res.send("Email is already registered.");
  }

  if (password !== passwordConfirmation) {
    return res.send("Password and password confirmation doesn't match");
  }

  const user = await usersRepo.create({
    email, password
  })

  req.session.userId = user.id;

  res.send("Account created succesfully");
})

app.route("/signout")
.get((req, res) => {
  req.session.userId = null;

  res.send("You have logged out.");
})

app.route("/signin")
.get((req, res) => {
  res.send(`
    <div>
      <form method="POST">
        <input type="text" name="email" placeholder="email" />
        <input type="text" name="password" placeholder="password" />
        <button>Sign In</button>
      </form>
    </div>
  `)
})
.post(async (req, res) => {
  const { email, password } = req.body;

  const user = await usersRepo.getOneBy({ email });

  const compare = await usersRepo.comparePassword(user.password, password);

  if (!user) {
    return res.send("Email doesn't exist.");
  }

  if (!compare) {
    return res.send("Password is incorrect.");
  }

  req.session.userId = user.id;

  res.send("Loggen In.");
})

app.listen(3000, () => {
  console.log("Server has started on port 3000.");
})