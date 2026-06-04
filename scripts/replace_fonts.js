const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk('d:\\ninoc-enterprise\\src', (err, files) => {
  if (err) throw err;
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    content = content.replace(/\bfont-bold\b/g, 'font-medium');
    content = content.replace(/\bfont-black\b/g, 'font-medium');
    content = content.replace(/\bfont-extrabold\b/g, 'font-medium');
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed fonts in:', file);
    }
  });
});
