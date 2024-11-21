# Licensing server
A simple licensing server written in express which checks if the username is valid and isn't blacklisted. It then compares the user serial against a stored hash and sends back the encrypted username converted to Base64 which is used to watermark the installed files to protect against unauthrized sharin
