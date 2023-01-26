import { select } from 'd3-selection'
import { format } from 'd3-format'
import * as lg from '../core/legend'

/**
 * A legend for choropleth maps
 *
 * @param {*} map
 */
export const legend = function (map, config) {
    //build generic legend object for the map
    const out = lg.legend(map)

    //the order of the legend elements. Set to false to invert.
    out.ascending = true

    //the width of the legend box elements
    out.shapeWidth = 13
    //the height of the legend box elements
    out.shapeHeight = 15

    //the separation line length
    out.sepLineLength = 17
    //the separation line color
    out.sepLineStroke = 'black'
    //the separation line width
    out.sepLineStrokeWidth = 1

    //the font size of the legend label
    out.labelFontSize = 12
    //the number of decimal for the legend labels
    out.labelDecNb = 2
    //the distance between the legend box elements to the corresponding text label
    out.labelOffset = 3
    //labelFormatter function
    out.labelFormatter = null

    //show no data
    out.noData = true
    //no data text label
    out.noDataText = 'No data'

    //override attribute values with config values
    if (config) for (let key in config) out[key] = config[key]

    //@override
    out.update = function () {
        const m = out.map
        const svgMap = m.svg()
        const lgg = out.lgg

        // update legend parameters if necessary
        if (m.legend_)
            for (let key in m.legend_) {
                out[key] = m.legend_[key]
            }

        //remove previous content
        lgg.selectAll('*').remove()

        //draw legend background box
        out.makeBackgroundBox()

        //draw title
        if (out.title)
            lgg.append('text')
                .attr('class', 'eurostatmap-legend-title')
                .attr('x', out.boxPadding)
                .attr('y', out.boxPadding + out.titleFontSize)
                .text(out.title)
                .style('font-size', out.titleFontSize + 'px')
                .style('font-weight', out.titleFontWeight)
                .style('font-family', m.fontFamily_)
                .style('fill', out.fontFill)

        //set font family
        lgg.style('font-family', m.fontFamily_)

        //define format for labels
        const f = out.labelFormatter ? out.labelFormatter : format('.' + out.labelDecNb + 'f')

        //draw legend elements for classes: rectangle + label
        for (let i = 0; i < m.clnb(); i++) {
            //the vertical position of the legend element
            const y = out.boxPadding + (out.title ? out.titleFontSize + out.boxPadding : 0) + i * out.shapeHeight

            //the class number, depending on order
            const ecl = out.ascending ? m.clnb() - i - 1 : i

            //rectangle
            lgg.append('rect')
                .attr('x', out.boxPadding)
                .attr('y', y)
                .attr('width', out.shapeWidth)
                .attr('height', out.shapeHeight)
                .attr('fill', m.classToFillStyle()(ecl, m.clnb()))
                .on('mouseover', function () {
                    // legend cell colour
                    select(this).style('fill', m.nutsrgSelFillSty())
                    // regions
                    highlightRegions(svgMap, ecl)

                    // apply hover to all external insets
                    if (out.map.insetTemplates_) {
                        let insets = out.map.insetTemplates_
                        for (const geo in insets) {
                            if (Array.isArray(insets[geo])) {
                                for (var i = 0; i < insets[geo].length; i++) {
                                    // insets with same geo that do not share the same parent inset
                                    if (Array.isArray(insets[geo][i])) {
                                        // this is the case when there are more than 2 different insets with the same geo. E.g. 3 insets for PT20
                                        for (var c = 0; c < insets[geo][i].length; c++) {
                                            if (insets[geo][i][c].svgId_ !== out.svgId_)
                                                highlightRegions(insets[geo][i][c].svg(), ecl)
                                        }
                                    } else {
                                        if (insets[geo][i].svgId_ !== out.svgId_) highlightRegions(insets[geo][i].svg(), ecl)
                                    }
                                }
                            } else {
                                // unique inset geo_
                                if (insets[geo].svgId_ !== out.svgId_) highlightRegions(insets[geo].svg(), ecl)
                            }
                        }
                    }
                })
                .on('mouseout', function () {
                    // legend cell colour
                    select(this).style('fill', m.classToFillStyle()(ecl, m.clnb()))
                    // regions
                    unhighlightRegions(svgMap, ecl)
                    // apply hover to all external insets
                    if (out.map.insetTemplates_) {
                        let insets = out.map.insetTemplates_
                        for (const geo in insets) {
                            if (Array.isArray(insets[geo])) {
                                for (var i = 0; i < insets[geo].length; i++) {
                                    // insets with same geo that do not share the same parent inset
                                    if (Array.isArray(insets[geo][i])) {
                                        // this is the case when there are more than 2 different insets with the same geo. E.g. 3 insets for PT20
                                        for (var c = 0; c < insets[geo][i].length; c++) {
                                            if (insets[geo][i][c].svgId_ !== out.svgId_)
                                                unhighlightRegions(insets[geo][i][c].svg(), ecl)
                                        }
                                    } else {
                                        if (insets[geo][i].svgId_ !== out.svgId_) unhighlightRegions(insets[geo][i].svg(), ecl)
                                    }
                                }
                            } else {
                                // unique inset geo_
                                if (insets[geo].svgId_ !== out.svgId_) unhighlightRegions(insets[geo].svg(), ecl)
                            }
                        }
                    }
                })

            //separation line
            if (i > 0)
                lgg.append('line')
                    .attr('class', 'eurostatmap-legend-line')
                    .attr('x1', out.boxPadding)
                    .attr('y1', y)
                    .attr('x2', out.boxPadding + out.sepLineLength)
                    .attr('y2', y)
                    .attr('stroke', out.sepLineStroke)
                    .attr('stroke-width', out.sepLineStrokeWidth)

            //label
            if (i < m.clnb() - 1)
                lgg.append('text')
                    .attr('class', 'eurostatmap-legend-label')
                    .attr('x', out.boxPadding + Math.max(out.shapeWidth, out.sepLineLength) + out.labelOffset)
                    .attr('y', y + out.shapeHeight)
                    .attr('alignment-baseline', 'middle')
                    .text(f(m.classifier().invertExtent(ecl)[out.ascending ? 0 : 1]))
                    .style('font-size', out.labelFontSize + 'px')
                    .style('font-family', m.fontFamily_)
                    .style('fill', out.fontFill)
        }

        //'no data' legend box
        if (out.noData) {
            const y =
                out.boxPadding +
                (out.title ? out.titleFontSize + out.boxPadding : 0) +
                m.clnb() * out.shapeHeight +
                out.boxPadding

            //rectangle
            lgg.append('rect')
                .attr('x', out.boxPadding)
                .attr('y', y)
                .attr('width', out.shapeWidth)
                .attr('height', out.shapeHeight)
                .attr('fill', m.noDataFillStyle())
                .attr('stroke', 'black')
                .attr('stroke-width', 0.5)
                .on('mouseover', function () {
                    select(this).style('fill', m.nutsrgSelFillSty())
                    highlightRegions(svgMap, 'nd')
                    // apply hover to all external insets
                    if (out.map.insetTemplates_) {
                        let insets = out.map.insetTemplates_
                        for (const geo in insets) {
                            if (Array.isArray(insets[geo])) {
                                for (var i = 0; i < insets[geo].length; i++) {
                                    // insets with same geo that do not share the same parent inset
                                    if (Array.isArray(insets[geo][i])) {
                                        // this is the case when there are more than 2 different insets with the same geo. E.g. 3 insets for PT20
                                        for (var c = 0; c < insets[geo][i].length; c++) {
                                            if (insets[geo][i][c].svgId_ !== out.svgId_)
                                                highlightRegions(insets[geo][i][c].svg(), 'nd')
                                        }
                                    } else {
                                        if (insets[geo][i].svgId_ !== out.svgId_) highlightRegions(insets[geo][i].svg(), 'nd')
                                    }
                                }
                            } else {
                                // unique inset geo_
                                if (insets[geo].svgId_ !== out.svgId_) highlightRegions(insets[geo].svg(), 'nd')
                            }
                        }
                    }
                })
                .on('mouseout', function () {
                    // legend cell colour
                    select(this).style('fill', m.noDataFillStyle())
                    unhighlightRegions(svgMap, 'nd')

                    // apply hover to all external insets
                    if (out.map.insetTemplates_) {
                        let insets = out.map.insetTemplates_
                        for (const geo in insets) {
                            if (Array.isArray(insets[geo])) {
                                for (var i = 0; i < insets[geo].length; i++) {
                                    // insets with same geo that do not share the same parent inset
                                    if (Array.isArray(insets[geo][i])) {
                                        // this is the case when there are more than 2 different insets with the same geo. E.g. 3 insets for PT20
                                        for (var c = 0; c < insets[geo][i].length; c++) {
                                            if (insets[geo][i][c].svgId_ !== out.svgId_)
                                                unhighlightRegions(insets[geo][i][c].svg(), 'nd')
                                        }
                                    } else {
                                        if (insets[geo][i].svgId_ !== out.svgId_) unhighlightRegions(insets[geo][i].svg(), 'nd')
                                    }
                                }
                            } else {
                                // unique inset geo_
                                if (insets[geo].svgId_ !== out.svgId_) unhighlightRegions(insets[geo].svg(), 'nd')
                            }
                        }
                    }
                })

            //'no data' label
            lgg.append('text')
                .attr('class', 'eurostatmap-legend-label')
                .attr('x', out.boxPadding + out.shapeWidth + out.labelOffset)
                .attr('y', y + out.shapeHeight * 0.5)
                .attr('alignment-baseline', 'middle')
                .text(out.noDataText)
                .style('font-size', out.labelFontSize + 'px')
                .style('font-family', m.fontFamily_)
                .style('fill', out.fontFill)
        }

        //set legend box dimensions
        out.setBoxDimension()
    }

    function highlightRegions(map, ecl) {
        const sel = map.selectAll('#g_nutsrg').selectAll("[ecl='" + ecl + "']")
        sel.style('fill', out.map.nutsrgSelFillSty())
        sel.attr('fill___', function () {
            select(this).attr('fill')
        })
    }

    function unhighlightRegions(map, ecl) {
        const sel = map.selectAll('#g_nutsrg').selectAll("[ecl='" + ecl + "']")
        sel.style('fill', function () {
            select(this).attr('fill___')
        })
    }

    return out
}
