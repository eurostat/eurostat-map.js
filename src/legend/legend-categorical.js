import { select } from 'd3-selection'
import * as lg from '../core/legend'
import { executeForAllInsets } from '../core/utils'

/**
 * A legend for categorical maps
 *
 * @param {*} map
 */
export const legend = function (map, config) {
    //build generic legend object for the map
    const out = lg.legend(map)

    //the width of the legend box elements
    out.shapeWidth = 13
    //the height of the legend box elements
    out.shapeHeight = 15
    //the distance between consecutive legend box elements
    out.shapePadding = 5
    //the font size of the legend label
    out.labelFontSize = 12
    //the distance between the legend box elements to the corresponding text label
    out.labelOffset = 5
    //show no data
    out.noData = true
    //no data label text
    out.noDataText = 'No data'
    // allow the user to define the order of the legend elements manually as an array
    out.order = undefined

    //override attribute values with config values
    if (config) for (let key in config) out[key] = config[key]

    //@override
    out.update = function () {
        const m = out.map
        const lgg = out.lgg
        const svgMap = m.svg()

        //remove previous content
        lgg.selectAll('*').remove()

        //draw legend background box
        out.makeBackgroundBox()

        //draw title
        if (out.title) {
            lgg.append('text')
                .attr('class', 'em-legend-title')
                .attr('x', out.boxPadding)
                .attr('y', out.boxPadding + out.titleFontSize)
                .text(out.title)
        }

        //set font family
        lgg.style('font-family', m.fontFamily_)

        //get category codes
        const ecls = out.order ? out.order : m.classifier().domain()

        //draw legend elements for classes: rectangle + label
        for (let i = 0; i < ecls.length; i++) {
            //the class
            const ecl_ = ecls[i]
            const ecl = m.classifier()(ecl_)
            const fillColor = m.classToFillStyle()[ecl_]

            //the vertical position of the legend element
            const y =
                out.boxPadding + (out.title ? out.titleFontSize + out.boxPadding : 0) + i * (out.shapeHeight + out.shapePadding)

            //rectangle
            lgg.append('rect')
                .attr('x', out.boxPadding)
                .attr('y', y)
                .attr('width', out.shapeWidth)
                .attr('height', out.shapeHeight)
                .style('fill', fillColor)
                .attr('stroke', 'black')
                .attr('stroke-width', 0.5)
                .on('mouseover', function () {
                    select(this).style('fill', m.hoverColor_)
                    highlightRegions(out.map, ecl)
                    if (out.map.insetTemplates_) {
                        executeForAllInsets(out.map.insetTemplates_, out.svgId_, highlightRegions, ecl)
                    }
                })
                .on('mouseout', function () {
                    select(this).style('fill', fillColor)
                    unhighlightRegions(out.map, ecl)
                    if (out.map.insetTemplates_) {
                        executeForAllInsets(out.map.insetTemplates_, out.svgId_, unhighlightRegions, ecl)
                    }
                })

            //label
            lgg.append('text')
                .attr('class', 'eurostat-map-legend-label')
                .attr('x', out.boxPadding + out.shapeWidth + out.labelOffset)
                .attr('y', y + out.shapeHeight * 0.5)
                .attr('dominant-baseline', 'middle')
                .text(m.classToText() ? m.classToText()[ecl_] : ecl_)
                .style('font-size', out.labelFontSize + 'px')
                .style('font-family', m.fontFamily_)
                .style('fill', out.fontFill)
        }

        //'no data' legend box
        if (out.noData) {
            const y =
                out.boxPadding +
                (out.title ? out.titleFontSize + out.boxPadding : 0) +
                ecls.length * (out.shapeHeight + out.shapePadding)

            //rectangle
            lgg.append('rect')
                .attr('x', out.boxPadding)
                .attr('y', y)
                .attr('width', out.shapeWidth)
                .attr('height', out.shapeHeight)
                .style('fill', m.noDataFillStyle_)
                .attr('stroke', 'black')
                .attr('stroke-width', 0.5)
                .on('mouseover', function () {
                    select(this).style('fill', m.hoverColor_)
                    highlightRegions(out.map, 'nd')
                    if (out.map.insetTemplates_) {
                        executeForAllInsets(out.map.insetTemplates_, out.svgId_, highlightRegions, 'nd')
                    }
                })
                .on('mouseout', function () {
                    select(this).style('fill', m.noDataFillStyle_)
                    unhighlightRegions(out.map, 'nd')
                    if (out.map.insetTemplates_) {
                        executeForAllInsets(out.map.insetTemplates_, out.svgId_, unhighlightRegions, 'nd')
                    }
                })
            // .on('mouseover', function () {
            //     const sel = svgMap.select('#g_nutsrg').selectAll("[ecl='nd']")
            //     sel.style('fill', m.hoverColor())
            //     select(this).style('fill', m.hoverColor())
            // })
            // .on('mouseout', function () {
            //     const sel = svgMap.select('#g_nutsrg').selectAll("[ecl='nd']")
            //     sel.style('fill', function (d) {
            //         select(this).attr('fill___')
            //     })
            //     select(this).style('fill', m.noDataFillStyle())
            // })

            //'no data' label
            lgg.append('text')
                .attr('class', 'eurostat-map-legend-label')
                .attr('x', out.boxPadding + out.shapeWidth + out.labelOffset)
                .attr('y', y + out.shapeHeight * 0.5)
                .attr('dominant-baseline', 'middle')
                .text(out.noDataText)
                .style('font-size', out.labelFontSize + 'px')
                .style('font-family', m.fontFamily_)
                .style('fill', out.fontFill)
        }

        //set legend box dimensions
        out.setBoxDimension()
    }

    // Highlight selected regions on mouseover
    function highlightRegions(map, ecl) {
        const selector = out.map.geo_ === 'WORLD' ? '#g_worldrg' : '#g_nutsrg'
        const allRegions = map.svg_.selectAll(selector).selectAll('[ecl]')

        // Set all regions to white
        allRegions.style('fill', 'white')

        // Highlight only the selected regions by restoring their original color
        const selectedRegions = allRegions.filter("[ecl='" + ecl + "']")
        selectedRegions.each(function () {
            select(this).style('fill', select(this).attr('fill___')) // Restore original color for selected regions
        })
    }

    // Reset all regions to their original colors on mouseout
    function unhighlightRegions(map) {
        const selector = out.map.geo_ === 'WORLD' ? '#g_worldrg' : '#g_nutsrg'
        const allRegions = map.svg_.selectAll(selector).selectAll('[ecl]')

        // Restore each region's original color from the fill___ attribute
        allRegions.each(function () {
            select(this).style('fill', select(this).attr('fill___'))
        })
    }

    return out
}
