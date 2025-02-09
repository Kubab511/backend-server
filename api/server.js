const express = require('express');
const crypto = require('crypto');
const jsonfile = require('jsonfile');
const path = require('path');
const PORT = 5000;

const app = express();

app.use(express.json());
const usersFilePath = path.join(__dirname, 'users.json');

const key = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAnJ9hV/B+4xXkb3h9dy1t1BEIqTQrKQb7lS355hGCq+7Rs3q/
+mSG717KwcxHlNYXwxBpw81ztmIMSTKYb1n9i9XWIEOsIDgwG/orSySWehN0qZiS
H42heGQdQSKVySsHGQWoCfm6UVwdIwuXIJ96tKQE0igSxSoCDodhffShIfXCU5lp
RjpEzegx4lDuV8i+pYL3U0+I9Pduot5c/zVBNlEHlD05MQscKzenNTYxT/hBOEQq
US+j0X5yoWg36V5Mtzu4yFV0TIGPhgdZru7EenZK0zD4EP/5tniQyCoVtpbCxG0/
1FFKfy6m+wobSYUFjh8+sPIBw7ZTQdaQBkRx4QIDAQABAoIBAFa9McTpDOyoqC1P
1nRVNXj3wgsrOCftlREmODrBQdQEXCCA/6clW1Ff9vxjLNVxyBEgmuJ0evvryxAS
tDce6Hsz/vU5ZS8mzwX/g1CHP8r10WtHcs2Eu4MYNtdm1vtlF/Y0mr6DjjsWv5A0
EAtiJyu5lm3pAZQt0pvHQCfofgB23hLKeQTQFg08eeYnk/j2cKtzEgG5T4EbTm75
CbalmW3WU6p4QIWsDxOu4roEkcQDw4BAFyEJFOnvQkNl1Wa6NOT0CTNfH066ajGd
y7H42vTgVN6pwYvyAq4B3B229b+5vQoKqdN3hGs7rPNHZo10lkkE1p7h8nAeMal0
XMviM1ECgYEA+0epAnmT3CZUH7JaIE42Y2tUk/aQUAMvEBc+387dOzmLtx0fUgk8
7yldi6FBHoYVU2FtpyUWBm/SqC54L+sHVEYV2wSaYsqN/dS/83b8X296klEqbtQh
E2M9NoRh4qnFk75GYaMHukorEPpMF3QKffSWzICDjZAm5gB6HfdsFVUCgYEAn5CJ
mdIxdXJxK5iTUSP7w39G/KOootjWIjH+RD/qVGj8Alu8hmRBVkcqR6QD/+5VkBuN
3+wlbCDM7tUXQZDVL2Sp/rGQ8PNZedaFPZQ4shElVkpidBDapjI/KuXRN6MOakfM
koYPB1bcuIzjnD4vH+IwNGA8HLYu478URjZ96l0CgYAGKVisldyZTltLt6zcE+7j
ezNEuYwKWjmiNF+3TzQ/ioaxg8ZL1awn1STVEqwtGm6Vb9MngRJMMBvDQfhyfFne
qCVLDI7Yk0zuB3R5fNZtZKdlxRW8R/lTp2BN4OshirYsjELfjAbZe44YyXpqLM9B
DWlRNGmFZB6AD0zvRSziTQKBgAWa0BqFFZOoh20emN4aw3cke1vYa838i9j7pJDF
Jff9EA0NJ9wYnWroaQXHLxTITF0ZeqxI4S+hH1GsTnrRGYvmn0oA9rRf996duGRn
Vm56x7L2PesRxHxd+3YISIcJxTHaf8cNym1Zkbsxx7TvQjx+d27/ilz/0TnStmWY
+GdJAoGAc5dwd+HKycfQNY76UimBCPAs1/5VYcQNDZUjXmeZFMRmVq8bir1ctg1U
iA+9PkjLyQq6tKaMwhpJ90XtUERqgwC/tIscsqWiaHBb3OJbxphDka9Rh9oed0qj
maeoK4nW68hAe5xzgFK4K8A72v3e5K5cRNiyPROJLy0LmfpGuls=
-----END RSA PRIVATE KEY-----`;

const loadUsers = async () => {
  try {
    const data = await jsonfile.readFile(usersFilePath);
    return data.users;
  } catch (error) {
    console.error('Error reading users.json:', error);
    throw error;
  }
};

var date = new Date();
date.setDate(date.getDate() + 7);
date.setHours(23, 59, 59, 999);
date = date.toISOString();

app.post('/api', async (req, res) => {
  console.log('Received JSON data:', req.body);
  const { deviceID, serial } = req.body;

  const users = await loadUsers();
  const user = users.find((user) => user.deviceID === deviceID && user.serial === serial);

  if (!user) {
    return res.status(401).send("");
  }

  let data = {
    deviceID: deviceID,
    expirationDate: date
  };

  data = JSON.stringify(data);

  const sign = crypto.createSign('sha256');
  sign.update(data);
  sign.end();
  const signature = sign.sign(key, 'base64');

  res.json({
    data: {
      deviceID: deviceID,
      expirationDate: date
    },
    signature: signature
  });
});

// module.exports = app;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});