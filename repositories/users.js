const fs = require("fs");
const crypto = require("crypto");
const util = require("util");

const scrypt = util.promisify(crypto.scrypt);

class UsersRepository {
  constructor(filename) {
    // Iche-check natin kung may pinasang filename. Kung wala, show an error
    if (!filename) {
      throw new Error("Need filename");
    }
    // Kapag may filename na pinass-in, create an instance variable of it.
    this.filename = filename;

    // Now, we are going to check if the given filename exist using the accessSync
    try {
      fs.accessSync(this.filename);
    } catch (err) {
      fs.writeFileSync(this.filename, "[]");
    }
  }

  async getAll() {
    return JSON.parse(await fs.promises.readFile(this.filename, {
      encoding: "utf8"
    }));
  }

  async writeAll(records) {
    await fs.promises.writeFile(this.filename, JSON.stringify(records, null, 2));
  }

  async create(attrs) {
    attrs.id = this.randomId();
    
    const salt = crypto.randomBytes(8).toString("hex");
    // This returns an array of buffer
    const hashAndSalt = await scrypt(attrs.password, salt, 64);

    const records = await this.getAll();
    const record = {
      ...attrs,
      password: `${hashAndSalt.toString("hex")}-${salt}`
    }
    records.push(record);

    await this.writeAll(records);

    return record;
  }

  async getOne(id) {
    const records = await this.getAll();

    return records.reduce((output, record) => {
      if (id !== record.id) {
        return output;
      } else {
        return record;
      }
    }, "ID not found.")
  }

  async getOneBy(filters) {
    const records = await this.getAll();

    for (let record of records) {
      let found = true;

      // We are going to iterate each filters property, and check if its value is the same as the one inside the record object.
      for (let key in filters) {
        if (filters[key] !== record[key]) {
          found = false;
        }
      }
      // If found is still true after comparing the values, return that record
      if (found) {
        return record;
      }
    }
  }

  async delete(id) {
    const records = await this.getAll();

    const filteredRecords = records.filter(record => {
      return record.id !== id;
    })

    await this.writeAll(filteredRecords);
  }

  async update(id, attrs) {
    const records = await this.getAll();

    const checkId = records.some(record => record.id === id);

    if (!checkId) {
      throw new Error("ID doesn't exist");
    }

    const mappedRecords = records.map(record => {
      return record.id === id ? {...record, ...attrs} : record;
    })

    await this.writeAll(mappedRecords);
  }

  async comparePassword(saved, supplied) {
    const [hashed, salt] = saved.split("-");

    const suppliedHashBuff = await scrypt(supplied, salt, 64);

    return hashed === suppliedHashBuff.toString("hex");
  }

  randomId() {
    return crypto.randomBytes(4).toString("hex");
  }
}

// const test = async () => {
//   const repo = new UsersRepository("users.json");

//   const user = await repo.create({
//     email: "wewew@gm.com",
//     password: "pwehehe"
//   })

//   console.log(user);
// }

// test();

module.exports = new UsersRepository("users.json");
