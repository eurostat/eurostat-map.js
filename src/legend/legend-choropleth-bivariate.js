import { select } from 'd3-selection'
import * as lg from '../core/legend'
import { line } from 'd3-shape'

/**
 * A legend for choropleth-bivariate maps
 *
 * @param {*} map
 */
export const legend = function (map, config) {
    //build generic legend object for the map
    const out = lg.legend(map)

    //size
    out.squareSize = 30

    //orientation
    out.rotation = 0

    //labels
    out.label1 = 'Variable 1'
    out.label2 = 'Variable 2'
    //the font size of the legend label
    out.labelFontSize = 12

    //breaks
    out.breaks1 = undefined
    out.breaks2 = undefined

    //show no data
    out.noData = true
    //show no data
    out.noDataShapeSize = 15
    //no data text label
    out.noDataText = 'No data'

    //override padding
    out.boxPadding = out.labelFontSize

    //add extra distance between legend and no data item
    out.noDataYOffset = 20

    //arrows
    out.arrowHeight = 15
    out.arrowWidth = 14
    out.arrowPadding = {
        x: 5,
        y: -20,
    }

    //override attribute values with config values
    if (config) for (let key in config) out[key] = config[key]

    //@override
    out.update = function () {
        const m = out.map
        const svgMap = m.svg()
        const lgg = out.lgg
        const clnb = m.clnb()
        const sz = out.squareSize / clnb
        const xc = out.rotation === 0 ? 0 : 0.7071 * out.squareSize + out.boxPadding

        //remove previous content
        lgg.selectAll('*').remove()

        //draw legend background box
        out.makeBackgroundBox()

        //draw title
        if (out.title)
            lgg.append('text')
                .attr('class', 'eurostat-map-legend-title')
                .attr('x', xc)
                .attr('y', out.boxPadding + out.titleFontSize)
                .text(out.title)
                .style('text-anchor', 'middle')
                .style('font-size', out.titleFontSize + 'px')
                .style('font-weight', out.titleFontWeight)
                .style('font-family', m.fontFamily_)
                .style('fill', out.fontFill)

        //set font family
        lgg.style('font-family', m.fontFamily_)

        //the vertical position of the legend element
        let y = out.boxPadding + (out.title ? out.titleFontSize + out.boxPadding : 0)

        //square group
        const square = lgg
            .append('g')
            .attr(
                'transform',
                'translate(' +
                    (out.boxPadding + (out.rotation == 0 ? out.arrowWidth / 2 + out.labelFontSize / 2 : 0)) +
                    ',' +
                    (xc + y) +
                    ') rotate(' +
                    out.rotation +
                    ') translate(' +
                    out.boxPadding +
                    ',' +
                    0 +
                    ')'
            )

        for (let i = 0; i < clnb; i++)
            for (let j = 0; j < clnb; j++) {
                //the class numbers, depending on order
                const ecl1 = clnb - i - 1
                const ecl2 = clnb - j - 1
                const fill = m.classToFillStyle()(ecl1, ecl2)

                //draw rectangle
                square
                    .append('rect')
                    .attr('x', (clnb - 1 - i) * sz)
                    .attr('y', j * sz)
                    .attr('width', sz)
                    .attr('height', sz)
                    .attr('fill', fill)
                    .on('mouseover', function () {
                        const nRg = out.map.nutsLvl_ == 'mixed' ? svgMap.selectAll('#g_nutsrg') : svgMap.select('#g_nutsrg')
                        const sel = nRg.selectAll("[ecl1='" + ecl1 + "']").filter("[ecl2='" + ecl2 + "']")
                        sel.style('fill', m.nutsrgSelFillSty())
                        sel.attr('fill___', function () {
                            select(this).attr('fill')
                        })
                        select(this).style('fill', m.nutsrgSelFillSty())
                    })
                    .on('mouseout', function () {
                        const nRg = out.map.nutsLvl_ == 'mixed' ? svgMap.selectAll('#g_nutsrg') : svgMap.select('#g_nutsrg')
                        const sel = nRg.selectAll("[ecl1='" + ecl1 + "']").filter("[ecl2='" + ecl2 + "']")
                        sel.style('fill', function () {
                            select(this).attr('fill___')
                        })
                        select(this).style('fill', fill)
                    })
            }

        //breaks 1
        if (out.breaks1)
            for (let i = 0; i < out.breaks1.length; i++)
                square
                    .append('text')
                    .attr('x', sz * (i + 1) - sz / 2)
                    .attr('y', out.squareSize + out.labelFontSize)
                    .text(out.breaks1[i])
                    .attr('text-anchor', 'middle')
                    .style('font-size', out.labelFontSize + 'px')
                    .style('font-family', m.fontFamily_)
                    .style('fill', out.fontFill)
        // .attr('dominant-baseline', 'central')

        //breaks 2
        if (out.breaks2)
            for (let i = 0; i < out.breaks2.length; i++) {
                let x = -out.labelFontSize / 1.5
                let y = sz * (i + 1) - sz / 2
                square
                    .append('text')
                    .attr('x', x)
                    .attr('y', y)
                    .text(out.breaks2[i])
                    .attr('text-anchor', 'middle')
                    .style('font-size', out.labelFontSize + 'px')
                    .style('font-family', m.fontFamily_)
                    .style('fill', out.fontFill)
                    .attr('dominant-baseline', 'central')
                    .attr('transform', `rotate(-90, ${x}, ${y})`) // Apply rotation
            }

        // X axis title
        square
            .append('text')
            .attr('x', 0)
            .attr('y', out.squareSize + out.labelFontSize + out.arrowHeight / 1.5 + (out.breaks1 ? out.labelFontSize + 2 : 0))
            .text(out.label1)
            .style('font-size', out.labelFontSize + 'px')
            .style('font-family', m.fontFamily_)
            .style('fill', out.fontFill)

        // y axis title
        square
            .append('text')

            // settings for -45 rotation
            // .attr('x', -out.labelFontSize)
            // .attr('y', out.labelFontSize)
            // .attr('transform', 'rotate(90) translate(' + out.labelFontSize + ',0)')

            // settings for 0 or 45 rotation
            .attr('x', out.rotation == 0 ? -out.squareSize : -out.labelFontSize + out.arrowWidth / 2) //with roation 0, acts as Y axis
            .attr(
                'y',
                (out.rotation == 0 ? -out.arrowWidth / 1.5 : out.labelFontSize + out.arrowHeight / 2) + out.arrowPadding.y / 2
            )
            .attr(
                'transform',
                out.rotation == 0
                    ? 'rotate(-90) translate(0,' + -out.labelFontSize / 2 + ')'
                    : 'rotate(90) translate(' + out.labelFontSize / 2 + ',0)'
            )

            .text(out.label2)
            .style('font-size', out.labelFontSize + 'px')
            .style('font-family', m.fontFamily_)
            .style('fill', out.fontFill)
        //https://stackoverflow.com/questions/16726115/svg-text-rotation-around-the-center/30022443

        //frame
        square
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', out.squareSize)
            .attr('height', out.squareSize)
            .attr('fill', 'none')
            .style('stroke', 'black')
            .attr('stroke-width', 0.7)

        // ARROWS
        square
            .append('defs')
            .append('marker')
            .attr('viewBox', `0 0 ${out.arrowWidth} ${out.arrowHeight}`)
            .attr('id', 'arrowhead')
            .attr('refX', 0)
            .attr('refY', 5)
            .attr('markerWidth', out.arrowWidth)
            .attr('markerHeight', out.arrowHeight)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M 0 0 L 5 5 L 0 10') //M2,2 L10,6 L2,10 L6,6 L2,2
            .attr('marker-units', 'strokeWidth')

        // horizontal arrow
        square
            .append('path')
            .attr(
                'd',
                line()([
                    [0, out.squareSize + out.arrowHeight + out.arrowPadding.x], // origin
                    [out.squareSize, out.squareSize + out.arrowHeight + out.arrowPadding.x], // destination
                ])
            )
            .attr('stroke', 'black')
            .attr('marker-end', 'url(#arrowhead)')

        // vertical arrow
        square
            .append('path')
            .attr(
                'd',
                line()([
                    [out.arrowPadding.y, out.squareSize],
                    [out.arrowPadding.y, 0],
                ])
            )
            .attr('stroke', 'black')
            .attr('marker-end', 'url(#arrowhead)')

        //'no data' legend box
        if (out.noData) {
            // add extra padding when rotation is 0
            let noDataYOffset =
                out.rotation == 0 ? out.noDataYOffset + out.squareSize / out.map.clnb_ + out.arrowHeight / 2 : out.noDataYOffset

            y =
                out.rotation == 0
                    ? y + out.squareSize + noDataYOffset
                    : y + 1.4142 * out.squareSize + out.boxPadding * 2 + noDataYOffset

            //rectangle
            lgg.append('rect')
                .attr('x', out.boxPadding)
                .attr('y', y)
                .attr('width', out.noDataShapeSize)
                .attr('height', out.noDataShapeSize)
                .attr('fill', m.noDataFillStyle())
                .attr('stroke', 'black')
                .attr('stroke-width', 0.7)
                .on('mouseover', function () {
                    const nRg = out.map.nutsLvl_ == 'mixed' ? svgMap.selectAll('#g_nutsrg') : svgMap.select('#g_nutsrg')
                    const sel = nRg.selectAll("[nd='nd']")
                    sel.style('fill', m.nutsrgSelFillSty())
                    sel.attr('fill___', function (d) {
                        select(this).attr('fill')
                    })
                    select(this).style('fill', m.nutsrgSelFillSty())
                })
                .on('mouseout', function () {
                    const nRg = out.map.nutsLvl_ == 'mixed' ? svgMap.selectAll('#g_nutsrg') : svgMap.select('#g_nutsrg')
                    const sel = nRg.selectAll("[nd='nd']")
                    sel.style('fill', function (d) {
                        select(this).attr('fill___')
                    })
                    select(this).style('fill', m.noDataFillStyle())
                })
            //'no data' label
            lgg.append('text')
                .attr('x', out.boxPadding + out.noDataShapeSize + 5)
                .attr('y', y + out.noDataShapeSize * 0.5 + 1)
                .attr('dominant-baseline', 'middle')
                .text(out.noDataText)
                .style('font-size', out.labelFontSize + 'px')
                .style('font-family', m.fontFamily_)
                .style('fill', out.fontFill)
        }

        //set legend box dimensions
        out.setBoxDimension()
    }

    return out
}
