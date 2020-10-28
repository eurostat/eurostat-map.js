var assert = require('assert');
const puppeteer = require("puppeteer");
const path = require("path")

// runs test.html
test('population density map', async () => {
    let browser = await puppeteer.launch({
        headless: true,
        // sloMo: 80,
        args: ["--window-size=1000,1000"]
    })

    const page = await browser.newPage();

    await page.goto(`file:${path.join(__dirname, 'test.html')}`)

    // evaluate will run the function in the page context
    await page.evaluate(_ => {
        // this will be executed within the page, that was loaded before
        eurostatmap
            .map()
            .width(900)
            .scale("20M")
            .NUTSyear(2016)
            .datasetCode("demo_r_d3dens")
            .classifMethod("threshold").threshold([50, 75, 100, 150, 300, 850])

            .unitText("people/km²")
            .tooltipShowFlags(false)
            .legendTitleText("Population density (people/km²)")
            .legendLabelDecNb(0)
            .legendBoxHeight(210)
            .legendBoxWidth(190)

            .build();
    });

    // we're done; close the browser
    await browser.close();

})