const bcrypt = require('bcrypt');

const generateHash = async (password) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log('Hashed Password:', hashedPassword);
};

generateHash('Station1');