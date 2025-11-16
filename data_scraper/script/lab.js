const link = "https://sdsu.instructure.com/files/10261723/download?download_frd=1&verifier=v1rKouAYLw0aiDRBZqD9VHr2PwvNq1gD6SMOlsyi,Sep of Powers wkst.docx";

const ID = link.substr(link.indexOf("files/") + 6, (link.indexOf("/download") - (link.indexOf("files/") + 6)));
const verifier = link.substr(link.indexOf("verifier=") + 9,(link.indexOf(",") - (link.indexOf("verifier=") + 9)));

console.log((link.indexOf(",") - (link.indexOf("verifier=") + 9)));
console.log(link.indexOf("verifier="));
console.log(link.indexOf(","));
console.log(link.length)

console.log(`ID: ${ID}`);
console.log(`verifier: ${verifier}`);
print(link.indexOf("verifier=") + 9,(link.indexOf(",") - (link.indexOf("verifier=") + 9)));