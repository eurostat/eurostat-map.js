var assert = require('assert');
const puppeteer = require("puppeteer");
const path = require("path")



// opens test.html using headless chrome
// to run tests in open browser, set headless to false.
test('proportional symbol map', async () => {
    let browser = await puppeteer.launch({
        headless: true,
        //sloMo: 80,
        args: ["--window-size=1000,1000"]
    })

    const page = await browser.newPage();

    await page.goto(`file:${path.join(__dirname, 'test.html')}`)

    // evaluate will run the function in the page context
    await page.evaluate(_ => {
        // these will be executed within test.html, that was loaded before
        //builds test map in test.html
        eurostatmap.map("ps")
            .svgId("testMap1")
            .stat( { eurostatDatasetCode:"demo_r_pjangrp3", filters:{ age: "TOTAL", sex: "T", unit: "NR", time: 2016 }, unitText: "inhabitants" } )
            .psMaxSize(25)
            .psStrokeWidth(0.3)
            .tooltipShowFlags("long")
            .legend({
                title: "Population",
                cellNb: 6,
                labelDecNb: 0,
            })
            .build();
    });

    // we're done; close the browser
    await browser.close();

})