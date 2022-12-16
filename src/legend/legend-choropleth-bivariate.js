import { select } from 'd3-selection'
import * as lg from '../core/legend'

/**
 * A legend for choropleth-bivariate maps
 *
 * @param {*} map
 */
export const legend = function (map, config) {
    //build generic legend object for the map
    const out = lg.legend(map)

    //size
    out.squareSize = 50

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

    //override attribute values with config values
    if (config) for (let key in config) out[key] = config[key]

    //@override
    out.update = function () {
        const m = out.map
        const svgMap = m.svg()
        const lgg = out.lgg
        const clnb = m.clnb()
        const sz = out.squareSize / clnb
        const xc = 0.7071 * out.squareSize + out.boxPadding

        //remove previous content
        lgg.selectAll('*').remove()

        //draw legend background box
        out.makeBackgroundBox()

        //draw title
        if (out.title)
            lgg.append('text')
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
                'translate(' + out.boxPadding + ',' + (xc + y) + ') rotate(-45) translate(' + out.boxPadding + ',' + 0 + ')'
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
                    .attr('x', sz * (i + 1))
                    .attr('y', out.squareSize + out.labelFontSize)
                    .text(out.breaks1[i])
                    .attr('text-anchor', 'middle')
                    .style('font-size', out.labelFontSize + 'px')
                    .style('font-family', m.fontFamily_)
                    .style('fill', out.fontFill)

        //breaks 2
        if (out.breaks2) for (let i = 0; i < out.breaks2.length; i++) console.log('legend.breaks2 not yet implemented')
        //TODO similar to break 1 and label 2

        //labels 1
        square
            .append('text')
            .attr('x', 0)
            .attr('y', out.squareSize + out.labelFontSize + (out.breaks1 ? out.labelFontSize + 2 : 0))
            .text(out.label1)
            .style('font-size', out.labelFontSize + 'px')
            .style('font-family', m.fontFamily_)
            .style('fill', out.fontFill)

        //labels 2
        square
            .append('text')
            .attr('x', -out.labelFontSize)
            .attr('y', out.labelFontSize)
            .text(out.label2)
            .attr('transform', 'rotate(90) translate(' + out.labelFontSize + ',0)')
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

        //'no data' legend box
        if (out.noData) {
            y = y + 1.4142 * out.squareSize + out.boxPadding * 2 + out.labelFontSize

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
                    const sel = svgMap.select('#g_nutsrg').selectAll("[nd='nd']")
                    sel.style('fill', m.nutsrgSelFillSty())
                    sel.attr('fill___', function (d) {
                        select(this).attr('fill')
                    })
                    select(this).style('fill', m.nutsrgSelFillSty())
                })
                .on('mouseout', function () {
                    const sel = svgMap.select('#g_nutsrg').selectAll("[nd='nd']")
                    sel.style('fill', function (d) {
                        select(this).attr('fill___')
                    })
                    select(this).style('fill', m.noDataFillStyle())
                })
            //'no data' label
            lgg.append('text')
                .attr('x', out.boxPadding + out.noDataShapeSize + out.boxPadding)
                .attr('y', y + out.noDataShapeSize * 0.5)
                .attr('alignment-baseline', 'middle')
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
