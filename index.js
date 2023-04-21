const fs = require('fs');
const http = require('http');
const process = require('process')

const express = require('express');
const Router = express.Router;
const router = new Router();
const app = express();

const multer = require('multer');
const csv = require('fast-csv');

const server = http.createServer(app);
const port = 3001


var storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads')
    },
    filename(req, file, cb) {
        cb(null, file.fieldname + '.txt')
    }
})

var upload = multer({ storage, limits: { fieldSize: 25 * 1024 * 1024 } })
app.use(upload.any('files'))

// upload.single("file"),
// upload.array('files', 5),

router.post('/convert_csv', function (req, res) {

    try {
        let startTime = process.hrtime();
        let files = req.files
        // console.log(files)
        // console.log(files[0].originalname.split('.').pop())

        if (!files) {
            return res.send({ status: false, message: 'Please select the CSV' })
        }

        // let result = []
        let textResult
        let OriginalString
        const fileRows = [];

        for (let i = 0; i < files.length; i++) {

            if (files[i].mimetype == 'text/csv') {

                csv.parseFile(files[i].path, { headers: false })
                    .on("data", (data) => {

                        fileRows.push(data);

                    })

                    .on("end", () => {

                        fs.unlinkSync(files[i].path);
                        fs.writeFileSync("output.json", JSON.stringify(fileRows), "utf-8", (err) => {
                            if (err) console.log(err)
                        })
                    })

                // break
            }

            if (files[i].mimetype == 'text/plain') {
                let originalLine = fs.readFileSync('./uploads/' + files[i].filename).toString()
                // OriginalString = originalLine.replace(/(\r\n|\n|\r)/gm, "")
                text = originalLine
                text = text.toLocaleLowerCase().replace(/[`0-9~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
                OriginalString = text.toLocaleLowerCase().replace(/[ ]{2,}/g, ' ')
                OriginalString = text.toLocaleLowerCase().replace(/(\r\n|\n|\r)/gm, " ")
                text = text.replace(/(\r\n|\n|\r)/gm, "")
                textResult = text.toLocaleLowerCase().replace(/[ ]{2,}/g, ' ').split(" ")

                // break
            }


        }

        let resolve = require('./output.json')

        let uniqueWord = new Map

        for (let i = 0; i < textResult.length; i++) {
            if (uniqueWord.has(textResult[i])) {
                uniqueWord.set(textResult[i], uniqueWord.get(textResult[i]) + 1)
            } else {
                uniqueWord.set(textResult[i], 1)
            }
        }

        let frenchWord = []
        let numberOfWordReplaceTimesResult = []
        for (let [key, value] of uniqueWord.entries()) {

            for (let i = 0; i < resolve.length; i++) {

                if (resolve[i][0] == key) {
                    let obj = {}
                    obj[key] = value
                    numberOfWordReplaceTimesResult.push(obj)
                    frenchWord.push([key, resolve[i][1]])
                }
            }

        }
        // console.log(frenchWord.length);      //Unique Word with French Word
        let result = OriginalString
        for (let i = 0; i < frenchWord.length; i++) {
            let reg = new RegExp(frenchWord[i][0], 'gi')
            result = result.replace(reg, frenchWord[i][1])
        }

        let numberOfWordReplaceTimes = numberOfWordReplaceTimesResult
        let timeTaken = (process.hrtime(startTime)[0] + (process.hrtime(startTime)[1] / 1e9)).toFixed(3);
        let memoryTaken = process.memoryUsage()

        let Response = {Result:result, Number_of_Time_Word_Replace: numberOfWordReplaceTimes, Time_Taken: timeTaken, Memory_Taken: memoryTaken}
        
        return res.status(200).send({ status: true, data: Response })

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }


});


app.use('/', router);


server.listen(port, function () {
    console.log('Express server listening on ', port);
});


