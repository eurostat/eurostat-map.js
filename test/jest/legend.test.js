var assert = require('assert');
const puppeteer = require("puppeteer");
const path = require("path")



// opens test.html using headless chrome
// to run tests in open browser, set headless to false.
test('separated legend', async () => {
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
        const map = eurostatmap
            .map("ch")
            .width(500)
            .scale("60M")
            .datasetCode("demo_r_d3dens")
            .classifMethod("threshold").threshold([50, 75, 100, 150, 300, 850])
            .unitText("people/km²")
            .tooltipShowFlags(false)
            .build();

        const lg = map.legend({
            gId: "legend",
            titleText: "Population density (people/km²)",
            labelDecNb: 0,
            height: 210,
            width: 190
        }).build();

    });

    // we're done; close the browser
    await browser.close();

})