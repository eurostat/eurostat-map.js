var assert = require('assert');
const puppeteer = require("puppeteer");
const path = require("path")



// opens test.html using headless chrome
// to run tests in open browser, set headless to false.
test('exporting map as SVG', async () => {
    let browser = await puppeteer.launch({
        headless: true,
        //sloMo: 80,
        //args: ["--window-size=1000,1000"]
    })

    const page = await browser.newPage();

    await page.goto(`file:${path.join(__dirname, 'test_geos.html')}`)

    // evaluate will run the function in the page context
    await page.evaluate(_ => {

        const geos = {
            "PT20":"32626",
            "PT30":"32628",
            "IC":"32628",
            "GF":"32622",
            "GP":"32620",
            "MQ":"32620",
            "CARIB":"32620",
            "RE":"32740",
            "YT":"32738",
            "MT":"3035",          
            "LI":"3035",
            "IS":"3035",          
            "SJ_SV":"3035",
            "SJ_JM":"3035",          
        }

        for(const geo in geos)
        eurostatmap
            .map("ch")
            .svgId("map_"+geo)
            .geo(geo).proj(geos[geo])
            .title(geo)
            .width(250)
            .height(250)
            .scale("01M")
            .zoomExtent([0,9999])
            .bottomText("")
            .build();

    });

    // we're done; close the browser
    await browser.close();

})