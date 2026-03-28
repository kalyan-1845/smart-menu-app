import bcrypt from "bcryptjs";
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash("test", salt);
console.log("Hash:", hash);
const match = await bcrypt.compare("test", hash);
console.log("Match:", match);
