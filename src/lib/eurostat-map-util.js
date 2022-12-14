/**
 * Return a GeoJSON feature representing a bounding box, with multipoint geometry.
 * This bounding box is an array like the one in topojson bbox element.
 * [xmin,ymin,xmax,ymax]
 * This is useful for to call d3.fitSize([w, h], getTopoJSONExtentAsGeoJSON(topo.bbox)))
 *
 * @param {*} bb The bounding box [xmin,ymin,xmax,ymax]. For topojson data, just give the topojson.bbox element.
 */
export const getBBOXAsGeoJSON = function (bb) {
    return {
        type: 'Feature',
        geometry: {
            type: 'MultiPoint',
            coordinates: [
                [bb[0], bb[1]],
                [bb[2], bb[3]],
            ],
        },
    }
}

// indexing

/**
 * Index JSONStat stat values by 'geo' code.
 * Return a structure like: {geo:{value:0,status:""}}
 *
 * @param {*} jsData The JSONStat data to index
 */
export const jsonstatToIndex = function (jsData) {
    const ind = {}
    const geos = jsData.Dimension('geo').id
    for (let i = 0; i < geos.length; i++) ind[geos[i]] = jsData.Data(i)
    return ind
}

/**
 * Index CSV stat values by 'geo' code.
 * Return a structure like: {geo:{value:0,status:""}}
 *
 * @param {*} csvData The CSV data to index
 * @param {*} geoCol The name of the geo column in the CSV data
 * @param {*} valueCol The name of the statistical value column in the CSV file.
 */
export const csvToIndex = function (csvData, geoCol, valueCol) {
    const ind = {}
    for (let i = 0; i < csvData.length; i++) {
        const d = csvData[i]
        const v = d[valueCol]
        ind[d[geoCol]] = { value: isNaN(+v) ? v : +v, status: '' }
    }
    return ind
}

/**
 * @description returns string with space as thousand separator
 * @function spaceAsThousandSeparator
 * @param {number} number
 */
export const spaceAsThousandSeparator = function (number) {
    return number.toLocaleString('en').replace(/,/gi, ' ')
}
