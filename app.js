var mysql = require('mysql');
const express = require("express");
var app = express()
const port = 3000
const bp = require('body-parser')
const nodemailer = require('nodemailer')
app.use(bp.json())
app.use(bp.urlencoded({extended: true}))
const puppeteer = require('puppeteer')
const fs = require('fs/promises')
const cookieParser = require("cookie-parser");
var session = require('express-session');
const oneDay = 1000 * 60 * 60 * 24;
require('dotenv').config();

app.use(session({
    secret: process.env.secret,
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

app.use(cookieParser());

/*async function start() {
    const browser = await puppeteer.launch()w
    const page = await browser.newPage()
    await page.goto("https://langtreetech.com")
    const s0 = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".s0")).map(x => x.textContent)
    })
    await fs.writeFile("s0.txt", s0.join("\r\n"))
    await browser.close()
}

start()*/

const transporter = nodemailer.createTransport({
    service: process.env.service,
    auth: {
        user: process.env.emailUser,
        pass: process.env.emailPassword
    }
});


var con = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database
});

app.use(express.static(__dirname + '/'));

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

app.set('view engine', 'ejs');

const {readFileSync, promises: fsPromises} = require('fs');

app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.post('/user', function(request, response) {
    // Capture the input fields
    let username = request.body.username;
    let password = request.body.password;
    // Ensure the input fields exists and are not empty
    if (username && password) {
        var sql = "SELECT * FROM ?? WHERE ?? = ? AND ?? = ?";
        var inserts = ['user', 'username', username, 'password', password]
        sql = mysql.format(sql, inserts)
        con.query(sql, function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the account exists
            if (results.length > 0) {
                session=request.session;
                session.userid=request.body.username;
                console.log(request.session)
                response.redirect('/')
            } else {
                response.send('Incorrect Username and/or Password!');
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.get('/login',(req,res) => {
    session=req.session;
    if(session.userid){
        res.redirect('/profile')
    }else
        res.render('login')
});

app.post('/inventoryOfficeUpdate', function (req, res) {
    session=req.session;
    var search = req.body.asset;
    var num = req.body.num;
    if(session.userid){
        if (num != "") {
            con.query('UPDATE office SET COUNT = "' + num + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
    }else
        res.render('login')

});

app.get('/officeInventory', (req, res) => {
    session=req.session;
    if(session.userid){
        con.query('SELECT * FROM office', function (err, result) {
            if (err) throw err;
            res.render('officeInventory', {data: result});
        });
    }else
        res.render('login')

});

app.post('/inventoryUpdate', function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.body.asset;
        var num = req.body.num;
        if (num != "") {
            con.query('UPDATE dstcitem SET COUNT = "' + num + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
    }else
        res.render('login')

});

app.get('/inventory', (req, res) => {
    session=req.session;
    if(session.userid){
        con.query('SELECT * FROM dstcitem', function (err, result) {
            if (err) throw err;
            res.render('inventory', {data: result});
        });
    }else
        res.render('login')

});

app.get("/addOffice", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render('addOffice')
    }else
        res.render('login')

});

app.post('/uploadOffice', function (req, res) {
    session=req.session;
    if(session.userid){
        var category = req.body.category
        var itemName = req.body.name;
        var itemLocation = req.body.location;
        var itemCount = req.body.count;
        var assetNum = req.body.asset;
        var itemMin = req.body.minimum

        if (category != "" && itemName != "" && itemLocation != "" && itemCount != "" && assetNum != "" && itemMin != "") {
            var sql = "INSERT INTO office (category, name, asset, location, count, min) VALUES ('" + category + "', '" + itemName + "', '" + assetNum + "', '" + itemLocation + "', '" + itemCount + "', '" + itemMin + "')";
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("1 record inserted");
            });
        } else {
            res.send("Please fill in all fields!");
        }
        res.redirect('/addItem');
    }else
        res.render('login')


});

app.get('/officeItems', (req, res) => {
    session=req.session;
    if(session.userid){
        con.query('SELECT * FROM office', function (err, result) {
            if (err) throw err;
            res.render('officeItems', {data: result});
        });
    }else
        res.render('login')

});

app.get("/sortOfficePrint", function (req, res) {
    session=req.session;
    if(session.userid){
        var sort = req.query.sort;

        if (sort != "") {
            var sql = 'SELECT * FROM office ORDER BY ' + sort + ''
            con.query(sql, function (err, result) {
                if (err) throw err;

                res.render('printOffice', {data: result});
            });
        } else {
            res.send("Please provide item name");
        }
    }else
        res.render('login')

});

app.get("/sortPrint", function (req, res) {
    session=req.session;
    if(session.userid){
        if (sort != "") {
            var sql = 'SELECT * FROM dstcitem ORDER BY ' + sort + ''
            con.query(sql, function (err, result) {
                if (err) throw err;

                res.render('printMode', {data: result});
            });
        } else {
            res.send("Please provide item name");
        }
    }else
        res.render('login')
    var sort = req.query.sort;


});

app.get('/printOffice', (req, res) => {
    session=req.session;
    if(session.userid){
        con.query('SELECT * FROM office', function (err, result) {
            if (err) throw err;
            res.render('printOffice', {data: result});
        });
    }else
        res.render('login')

});

app.get('/printMode', (req, res) => {
    session=req.session;
    if(session.userid){
        con.query('SELECT * FROM dstcitem', function (err, result) {
            if (err) throw err;
            res.render('printMode', {data: result});
        });
    }else
        res.render('login')

});

app.get('/', (req, res) => {
    session=req.session;
    if(session.userid){
        con.query('SELECT * FROM dstcitem', function (err, result) {
            if (err) throw err;
            res.render('index', {data: result});
        });
    }else
        res.render('login')

});

app.get("/searchOffice", function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.query.name;
        if (search != "") {
            con.query('SELECT * FROM office WHERE name LIKE "%' + search + '%"', function (err, result) {
                if (err) throw err;
                res.render('officeItems', {data: result});
            });
        } else {
            res.send("Please provide item name");
        }
    }else
        res.render('login')

});

app.get("/search", function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.query.name;
        if (search != "") {
            con.query('SELECT * FROM dstcitem WHERE name LIKE "%' + search + '%"', function (err, result) {
                if (err) throw err;
                res.render('index', {data: result});
            });
        } else {
            res.send("Please provide item name");
        }
    }else
        res.render('login')

});

app.get("/searchAsset", function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.query.asset;

        if (search != "") {
            con.query('SELECT * FROM dstcitem WHERE asset = "' + search + '"  ', function (err, result) {
                if (err) throw err;

                res.render('index', {data: result});
            });
        } else {
            res.send("Please provide asset number");
        }
    }else
        res.render('login')

});

app.get("/additem", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render('additem')
    }else
        res.render('login')

});

app.post('/uploadItem', function (req, res) {
    session=req.session;
    if(session.userid){
        var category = req.body.category
        var itemName = req.body.name;
        var itemLocation = req.body.location;
        var itemCount = req.body.count;
        var assetNum = req.body.asset;
        var itemMin = req.body.minimum

        if (category != "" && itemName != "" && itemLocation != "" && itemCount != "" && assetNum != "" && itemMin != "") {
            var sql = "INSERT INTO dstcitem (category, name, asset, location, count, min) VALUES ('" + category + "', '" + itemName + "', '" + assetNum + "', '" + itemLocation + "', '" + itemCount + "', '" + itemMin + "')";
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("1 record inserted");
            });
        } else {
            res.send("Please fill in all fields!");
        }
        res.redirect('/addItem');
    }else
        res.render('login')

});

app.get("/updateOffice", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render('updateOffice')
    }else
        res.render('login')

});

app.post('/changeOffice', function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.body.asset;
        var num = req.body.num;
        var tempName = req.body.name;
        var tempCategory = req.body.category;
        var tempLocation = req.body.newLocation;
        var tempAsset = req.body.newAsset;
        var tempMin = req.body.newMin;

        if (num != "") {
            var sql = mysql.format('SELECT * FROM office WHERE asset = ?', search)
            con.query(sql, function (err, result) {
                if (result[0].count += num <= result[0].min) {
                    console.log("test")
                    const mailOptions = {
                        from: 'rexrodedev@gmail.com',
                        to: 'rexrodedev@gmail.com',
                        subject: 'Inventory Outage Notification',
                        text: 'Greetings, this is a notification that ' + result[0].name + ' has reached a minimum quantity and might need to be ordered!'
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
                }
            });
            con.query('UPDATE office SET COUNT = COUNT + "' + num + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        if (tempName != "") {
            con.query('UPDATE office SET NAME = "' + tempName + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        if (tempCategory != "") {
            con.query('UPDATE office SET category = "' + tempCategory + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        if (tempLocation != "") {
            con.query('UPDATE office SET LOCATION = "' + tempLocation + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        if (tempAsset != "") {
            con.query('UPDATE office SET asset = "' + tempAsset + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        if (tempMin != "") {
            console.log("test")
            con.query('UPDATE office SET min = "' + tempMin + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        res.redirect('/updateOffice');
    }else
        res.render('login')

});

app.get("/updateItem", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render('updateItem')
    }else
        res.render('login')

});

app.post('/changeCount', function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.body.asset;
        var num = req.body.num;
        var tempName = req.body.name;
        var tempCategory = req.body.category;
        var tempLocation = req.body.newLocation;
        var tempAsset = req.body.newAsset;
        var tempMin = req.body.newMin;

        if (num != "") {
            var sql = mysql.format('SELECT * FROM dstcitem WHERE asset = ?', search)
            con.query(sql, function (err, result) {
                if (result[0].count += num <= result[0].min) {
                    console.log("test")
                    const mailOptions = {
                        from: 'rexrodedev@gmail.com',
                        to: 'rexrodedev@gmail.com',
                        subject: 'Inventory Outage Notification',
                        text: 'Greetings, this is a notification that ' + result[0].name + ' has reached a minimum quantity and might need to be ordered!'
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
                }
            });
            con.query('UPDATE dstcitem SET COUNT = COUNT + "' + num + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        if (tempName != "") {
            con.query('UPDATE dstcitem SET NAME = "' + tempName + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        if (tempCategory != "") {
            con.query('UPDATE dstcitem SET category = "' + tempCategory + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        if (tempLocation != "") {
            con.query('UPDATE dstcitem SET LOCATION = "' + tempLocation + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        if (tempAsset != "") {
            con.query('UPDATE dstcitem SET asset = "' + tempAsset + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        if (tempMin != "") {
            console.log("test")
            con.query('UPDATE dstcitem SET min = "' + tempMin + '"  WHERE asset = "' + search + '"', function (err, result) {
            });
        }
        res.redirect('/');
    }else
        res.render('login')

});

app.get("/quickOfficeAdd", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render('quickOfficeAdd')
    }else
        res.render('login')
});

app.post('/addOffice', function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.body.asset;
        if (search != "") {
            con.query('UPDATE office SET COUNT = COUNT + 1  WHERE asset = "' + search + '"', function (err, result) {
                if (err) throw err;
                res.redirect('/quickOfficeAdd');
            });
        } else {
            res.send("Please provide asset number");
        }
    }else
        res.render('login')

});

app.get("/quickAdd", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render('quickAdd')
    }else
        res.render('login')

});

app.post('/addOne', function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.body.asset;
        if (search != "") {
            con.query('UPDATE dstcitem SET COUNT = COUNT + 1  WHERE asset = "' + search + '"', function (err, result) {
                if (err) throw err;
                res.redirect('/quickAdd');
            });
        } else {
            res.send("Please provide asset number");
        }
    }else
        res.render('login')

});

app.get("/quickOfficeTake", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render('quickOfficeTake')
    }else
        res.render('login')

});

app.post('/takeOffice', function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.body.asset;

        if (search != "") {
            var sql = mysql.format('SELECT * FROM office WHERE asset = ?', search)
            con.query(sql, function (err, result) {
                if (result[0].count - 1 <= result[0].min) {
                    const mailOptions = {
                        from: 'rexrodedev@gmail.com',
                        to: 'rexrodedev@gmail.com',
                        subject: 'Inventory Outage Notification',
                        text: 'Greetings, this is a notification that ' + result[0].name + ' has reached a minimum quantity and might need to be ordered!'
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
                }
            });
            con.query('UPDATE office SET COUNT = COUNT - 1  WHERE asset = "' + search + '"', function (err, result) {
                if (err) throw err;
                res.redirect('/quickOfficeTake');
            });
        } else {
            res.send("Please provide asset number");
        }
    }else
        res.render('login')

});

app.get("/quickTake", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render('quickTake')
    }else
        res.render('login')

});

app.post('/takeOne', function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.body.asset;

        if (search != "") {
            var sql = mysql.format('SELECT * FROM dstcitem WHERE asset = ?', search)
            con.query(sql, function (err, result) {
                if (result[0].count - 1 <= result[0].min) {
                    const mailOptions = {
                        from: 'rexrodedev@gmail.com',
                        to: 'rexrodedev@gmail.com',
                        subject: 'Inventory Outage Notification',
                        text: 'Greetings, this is a notification that ' + result[0].name + ' has reached a minimum quantity and might need to be ordered!'
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
                }
            });
            con.query('UPDATE dstcitem SET COUNT = COUNT - 1  WHERE asset = "' + search + '"', function (err, result) {
                if (err) throw err;
                res.redirect('/quickTake');
            });
        } else {
            res.send("Please provide asset number");
        }
    }else
        res.render('login')

});

app.get("/deleteOffice", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render('deleteOffice')
    }else
        res.render('login')

});

app.post('/deleteOneOffice', function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.body.asset;
        if (search != "") {
            con.query('DELETE FROM office WHERE asset = "' + search + '"', function (err, result) {
                if (err) throw err;
                res.redirect('/officeItems');
            });
        } else {
            res.send("Please provide asset number");
        }
    }else
        res.render('login')

});

app.get("/deleteItem", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render('deleteItem')
    }else
        res.render('login')

});

app.post('/delete', function (req, res) {
    session=req.session;
    if(session.userid){
        var search = req.body.asset;
        if (search != "") {
            con.query('DELETE FROM dstcitem WHERE asset = "' + search + '"', function (err, result) {
                if (err) throw err;
                res.redirect('/');
            });
        } else {
            res.send("Please provide asset number");
        }

        /*function syncReadFile(filename) {
            const contents = readFileSync(filename, 'utf-8');

            const arr = contents.split(/\r?\n/);
            var tempMin = 0;
            var count = 0;
            for (let i = 0; i < arr.length; i++) {
                var sql = "INSERT INTO dstcitem (category, name, asset, location, count, min) VALUES " +
                    "('" + arr[i] + "', '" + arr[i+2] + "', '" + count + "', '" + arr[i+3] + arr[i+4] + "', '" + arr[i+1] + "', '" + tempMin + "')";
                con.query(sql, function (err, result) {});
                i = i += 4;
                count++;
            }
            return arr;
        }
        syncReadFile('s0.txt')*/
    }else
        res.render('login')

});

app.get("/sortOffice", function (req, res) {
    session=req.session;
    if(session.userid){
        var sort = req.query.sort;

        if (sort != "") {
            var sql = 'SELECT * FROM office ORDER BY ' + sort + ''
            con.query(sql, function (err, result) {
                if (err) throw err;

                res.render('officeItems', {data: result});
            });
        } else {
            res.send("Please provide item name");
        }
    }else
        res.render('login')

});

app.get("/sort", function (req, res) {
    session=req.session;
    if(session.userid){
        var sort = req.query.sort;

        if (sort != "") {
            var sql = 'SELECT * FROM dstcitem ORDER BY ' + sort + ''
            con.query(sql, function (err, result) {
                if (err) throw err;

                res.render('index', {data: result});
            });
        } else {
            res.send("Please provide item name");
        }
    }else
        res.render('login')

});

app.get("/showOfficeCategory", function (req, res) {
    session=req.session;
    if(session.userid){
        var tempValue = req.query.oneCategory;

        if (tempValue != "") {
            con.query('SELECT * FROM office WHERE category = "' + tempValue + '"  ', function (err, result) {
                if (err) throw err;

                res.render('officeItems', {data: result});
            });
        } else {
            res.send("Please provide item name");
        }
    }else
        res.render('login')

});

app.get("/showCategory", function (req, res) {
    session=req.session;
    if(session.userid){
        var tempValue = req.query.oneCategory;

        if (tempValue != "") {
            con.query('SELECT * FROM dstcitem WHERE category = "' + tempValue + '"  ', function (err, result) {
                if (err) throw err;

                res.render('index', {data: result});
            });
        } else {
            res.send("Please provide item name");
        }
    }else
        res.render('login')

});

app.listen(port, () => {
    console.log(`App listening at port ${port}`)
})