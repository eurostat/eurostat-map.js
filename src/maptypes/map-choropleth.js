import { select } from 'd3-selection'
import { min, max } from 'd3-array'
import { scaleQuantile, scaleQuantize, scaleThreshold } from 'd3-scale'
import { interpolateYlOrBr } from 'd3-scale-chromatic'
import * as smap from '../core/stat-map'
import * as lgch from '../legend/legend-choropleth'
import { spaceAsThousandSeparator } from '../lib/eurostat-map-util'

/**
 * Returns a chroropleth map.
 *
 * @param {*} config
 */
export const map = function (config) {
    //create map object to return, using the template
    const out = smap.statMap(config)

    //the number of classes
    out.clnb_ = 7
    //the classification method
    out.classifMethod_ = 'quantile' // or: equinter, threshold
    //the threshold, when the classification method is 'threshold'
    out.threshold_ = [0]
    //colors to use for classes
    out.colors_ = null
    //when computed automatically, ensure the threshold are nice rounded values
    out.makeClassifNice_ = true
    //the color function [0,1] -> color
    out.colorFun_ = interpolateYlOrBr
    //a function returning the color from the class i
    out.classToFillStyle_ = undefined
    //style for no data regions
    out.noDataFillStyle_ = 'lightgray'
    //the classifier: a function which return a class number from a stat value.
    out.classifier_ = undefined

    /**
     * Definition of getters/setters for all previously defined attributes.
     * Each method follow the same pattern:
     *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
     *  - To get the attribute value, call the method without argument.
     *  - To set the attribute value, call the same method with the new value as single argument.
     */
    ;[
        'clnb_',
        'classifMethod_',
        'threshold_',
        'makeClassifNice_',
        'colorFun_',
        'classToFillStyle_',
        'noDataFillStyle_',
        'classifier_',
        'colors_',
    ].forEach(function (att) {
        out[att.substring(0, att.length - 1)] = function (v) {
            if (!arguments.length) return out[att]
            out[att] = v
            return out
        }
    })

    //override of some special getters/setters
    out.colorFun = function (v) {
        if (!arguments.length) {
            return out.colorFun_
        }
        out.colorFun_ = v
        // update class style function
        if (out.filtersDefinitionFun_) {
            // if dot density
            out.classToFillStyle(getFillPatternLegend())
        } else {
            out.classToFillStyle(getColorLegend(out.colorFun(), out.colors_))
        }
        return out
    }
    out.threshold = function (v) {
        if (!arguments.length) return out.threshold_
        out.threshold_ = v
        out.clnb(v.length + 1)
        return out
    }
    out.filtersDefinitionFun = function (v) {
        if (!arguments.length) return out.filtersDefinitionFun_
        out.filtersDefinitionFun_ = v
        if (out.svg()) out.filtersDefinitionFun_(out.svg(), out.clnb_)
        return out
    }

    //override attribute values with config values
    if (config)
        [
            'clnb',
            'classifMethod',
            'threshold',
            'makeClassifNice',
            'colorFun',
            'classToFillStyle',
            'noDataFillStyle',
            'colors_',
        ].forEach(function (key) {
            if (config[key] != undefined) out[key](config[key])
        })

    //@override
    out.updateClassification = function () {
        // apply classification to all insets that are outside of the main map's SVG
        if (out.insetTemplates_) {
            for (const geo in out.insetTemplates_) {
                if (Array.isArray(out.insetTemplates_[geo])) {
                    for (var i = 0; i < out.insetTemplates_[geo].length; i++) {
                        // insets with same geo that do not share the same parent inset
                        if (Array.isArray(out.insetTemplates_[geo][i])) {
                            // this is the case when there are more than 2 different insets with the same geo. E.g. 3 insets for PT20
                            for (var c = 0; c < out.insetTemplates_[geo][i].length; c++) {
                                if (out.insetTemplates_[geo][i][c].svgId_ !== out.svgId_)
                                    applyClassificationToMap(out.insetTemplates_[geo][i][c])
                            }
                        } else {
                            if (out.insetTemplates_[geo][i].svgId_ !== out.svgId_)
                                applyClassificationToMap(out.insetTemplates_[geo][i])
                        }
                    }
                } else {
                    // unique inset geo_
                    if (out.insetTemplates_[geo].svgId_ !== out.svgId_) applyClassificationToMap(out.insetTemplates_[geo])
                }
            }
        }

        // apply to main map
        applyClassificationToMap(out)

        return out
    }

    function applyClassificationToMap(map) {
        //simply return the array [0,1,2,3,...,nb-1]
        const getA = function (nb) {
            return [...Array(nb).keys()]
        }

        //TODO: make it possible to use continuous color ramps?

        //use suitable classification type
        if (out.classifMethod_ === 'quantile') {
            //https://github.com/d3/d3-scale#quantile-scales
            const domain = out.statData().getArray()
            const range = getA(out.clnb())
            out.classifier(scaleQuantile().domain(domain).range(range))
        } else if (out.classifMethod_ === 'equinter') {
            //https://github.com/d3/d3-scale#quantize-scales
            const domain = out.statData().getArray()
            const range = getA(out.clnb())
            out.classifier(
                scaleQuantize()
                    .domain([min(domain), max(domain)])
                    .range(range)
            )
            if (out.makeClassifNice_) out.classifier().nice()
        } else if (out.classifMethod_ === 'threshold') {
            //https://github.com/d3/d3-scale#threshold-scales
            out.clnb(out.threshold().length + 1)
            const range = getA(out.clnb())
            out.classifier(scaleThreshold().domain(out.threshold()).range(range))
        }

        let selector = map.geo_ == 'WORLD' ? 'path.worldrg' : 'path.nutsrg'

        // assign class (ecl attribute) to regions, based on their value
        if (map.svg_) {
            let regions = map.svg().selectAll(selector)
            regions.attr('ecl', function (rg, w, e, t, d) {
                const sv = out.statData().get(rg.properties.id)
                // GISCO-2678 - lack of data no longer means no data, instead it is explicitly set using ':'.
                if (!sv) return
                const v = sv.value
                if (v != 0 && !v) return
                if (v == ':') return 'nd'
                let ecl = +out.classifier()(+v)
                return ecl
            })

            //when mixing NUTS, level 0 is separated from the rest (class nutsrg0)
            if (map.nutsLvl_ == 'mixed') {
                map.svg()
                    .selectAll('path.nutsrg0')
                    .attr('ecl', function (rg) {
                        const sv = out.statData().get(rg.properties.id)
                        if (!sv) return // GISCO-2678 - lack of data no longer means no data, instead it is explicitly set using ':'.
                        const v = sv.value
                        if (v != 0 && !v) return
                        if (v == ':') return 'nd'
                        return +out.classifier()(+v)
                    })
            }
        }
    }

    //@override
    out.updateStyle = function () {
        // apply style to insets
        // apply classification to all insets
        if (out.insetTemplates_) {
            for (const geo in out.insetTemplates_) {
                if (Array.isArray(out.insetTemplates_[geo])) {
                    for (var i = 0; i < out.insetTemplates_[geo].length; i++) {
                        // insets with same geo that do not share the same parent inset
                        if (Array.isArray(out.insetTemplates_[geo][i])) {
                            // this is the case when there are more than 2 different insets with the same geo. E.g. 3 insets for PT20
                            for (var c = 0; c < out.insetTemplates_[geo][i].length; c++) {
                                if (out.insetTemplates_[geo][i][c].svgId_ !== out.svgId_)
                                    applyStyleToMap(out.insetTemplates_[geo][i][c])
                            }
                        } else {
                            if (out.insetTemplates_[geo][i].svgId_ !== out.svgId_) applyStyleToMap(out.insetTemplates_[geo][i])
                        }
                    }
                } else {
                    // unique inset geo_
                    if (out.insetTemplates_[geo].svgId_ !== out.svgId_) applyStyleToMap(out.insetTemplates_[geo])
                }
            }
        }

        // apply to main map
        applyStyleToMap(out)

        return out
    }

    function applyStyleToMap(map) {
        // define function that returns a class' colour
        if (out.filtersDefinitionFun_) {
            // if dot density
            //set fill style
            out.classToFillStyle(getFillPatternLegend())
        } else {
            out.classToFillStyle(getColorLegend(out.colorFun(), out.colors_))
        }

        // set colour of regions
        if (map.svg_) {
            let selector = out.geo_ == 'WORLD' ? 'path.worldrg' : 'path.nutsrg'
            let regions = map.svg().selectAll(selector)
            regions
                .transition()
                .duration(out.transitionDuration())
                .attr('fill', function (rg) {
                    if (map.geo_ == 'WORLD') {
                        //world template
                        const ecl = select(this).attr('ecl')
                        if (!ecl) return out.cntrgFillStyle_
                        if (ecl === 'nd') return out.noDataFillStyle() || 'gray'
                        let cf = out.classToFillStyle_
                        let v = cf(ecl, out.clnb_)
                        if (!v) return out.cntrgFillStyle_
                        return v
                    } else {
                        // only apply data-driven colour to included countries for NUTS templates
                        if (out.countriesToShow_.includes(rg.properties.id[0] + rg.properties.id[1])) {
                            const ecl = select(this).attr('ecl')
                            if (!ecl) return out.nutsrgFillStyle_
                            if (ecl === 'nd') return out.noDataFillStyle() || 'gray'
                            return out.classToFillStyle()(ecl, out.clnb_)
                        } else {
                            return out.nutsrgFillStyle_
                        }
                    }
                })
                //set mouse events for regions
                //GISCO-2767 - mouseover region fill bug before transition ends
                .end()
                .then(
                    () => {
                        regions
                            .on('mouseover', function (e, rg) {
                                if (out.countriesToShow_ && out.geo_ !== 'WORLD') {
                                    if (out.countriesToShow_.includes(rg.properties.id[0] + rg.properties.id[1])) {
                                        const sel = select(this)
                                        sel.attr('fill___', sel.attr('fill'))
                                        sel.attr('fill', map.nutsrgSelFillSty_)
                                        if (out._tooltip) out._tooltip.mouseover(out.tooltip_.textFunction(rg, out))
                                    }
                                } else {
                                    const sel = select(this)
                                    sel.attr('fill___', sel.attr('fill'))
                                    sel.attr('fill', map.nutsrgSelFillSty_)
                                    if (out._tooltip) out._tooltip.mouseover(out.tooltip_.textFunction(rg, out))
                                }
                            })
                            .on('mousemove', function (e, rg) {
                                if (out.countriesToShow_ && out.geo_ !== 'WORLD') {
                                    if (out.countriesToShow_.includes(rg.properties.id[0] + rg.properties.id[1])) {
                                        if (out._tooltip) out._tooltip.mousemove(e)
                                    }
                                } else {
                                    if (out._tooltip) out._tooltip.mousemove(e)
                                }
                            })
                            .on('mouseout', function () {
                                const sel = select(this)
                                let newFill = sel.attr('fill___')
                                if (newFill) {
                                    sel.attr('fill', sel.attr('fill___'))
                                    if (map._tooltip) map._tooltip.mouseout()
                                }
                            })
                    },
                    (err) => {
                        // rejection
                    }
                )

            if (out.nutsLvl_ == 'mixed') {
                // Toggle visibility - only show NUTS 1,2,3 with stat values when mixing different NUTS levels
                map.svg()
                    .selectAll('path.nutsrg')
                    .style('display', function (rg) {
                        const ecl = select(this).attr('ecl')
                        const lvl = select(this).attr('lvl')
                        // always display NUTS 0 for mixed, and filter countries to show
                        if ((ecl && out.countriesToShow_.includes(rg.properties.id[0] + rg.properties.id[1])) || lvl == '0') {
                            return 'block'
                        } else {
                            // dont show unclassified regions
                            return 'none'
                        }
                    })

                    //toggle stroke - similar concept to display attr (only show borders of NUTS regions that are classified (as data or no data) - a la IMAGE)
                    .style('stroke', function (bn) {
                        const lvl = select(this).attr('lvl')
                        const ecl = select(this).attr('ecl')
                        if (ecl && lvl !== '0') {
                            return map.nutsbnStroke_[parseInt(lvl)] || '#777'
                        }
                    })
                    .style('stroke-width', function (rg) {
                        const lvl = select(this).attr('lvl')
                        const ecl = select(this).attr('ecl')
                        if (ecl && lvl !== '0') {
                            return map.nutsbnStrokeWidth_[parseInt(lvl)] || 0.2
                        }
                    })
            }

            // update labels of stat values, appending the stat labels to the region centroids
            if (out.labelsToShow_.includes('values')) {
                out.updateValuesLabels(map)
            }
        }
    }

    out.updateValuesLabels = function (map) {

        //clear previous labels
        let prevLabels = map.svg_.selectAll('g.stat-label > *')
        prevLabels.remove()
        let prevShadows = map.svg_.selectAll('g.stat-label-shadow > *')
        prevShadows.remove()

        map.svg_
            .selectAll('g.stat-label')
            .filter((d) => {
                if (out.countriesToShow_.includes(d.properties.id[0] + d.properties.id[1]) || out.geo_ == 'WORLD') {
                    const s = out.statData()
                    const sv = s.get(d.properties.id)
                    if (!sv || !sv.value) {
                        return false
                    } else {
                        return true
                    }
                }
                return false
            })
            .append('text')
            .text(function (d) {
                if (out.countriesToShow_.includes(d.properties.id[0] + d.properties.id[1]) || out.geo_ == 'WORLD') {
                    const s = out.statData()
                    const sv = s.get(d.properties.id)
                    if (!sv || !sv.value) {
                        return ''
                    } else {
                        if (sv.value !== ':') {
                            return spaceAsThousandSeparator(sv.value)
                        }
                    }
                }
            })

        //add shadows to labels
        if (out.labelShadow_) {
            map.svg_
                .selectAll('g.stat-label-shadow')
                .filter((d) => {
                    if (out.countriesToShow_.includes(d.properties.id[0] + d.properties.id[1]) || out.geo_ == 'WORLD') {
                        const s = out.statData()
                        const sv = s.get(d.properties.id)
                        if (!sv || !sv.value) {
                            return false
                        } else {
                            return true
                        }
                    }
                    return false
                })
                .append('text')
                .text(function (d) {
                    if (out.countriesToShow_.includes(d.properties.id[0] + d.properties.id[1]) || out.geo_ == 'WORLD') {
                        const s = out.statData()
                        const sv = s.get(d.properties.id)
                        if (!sv || !sv.value) {
                            return ''
                        } else {
                            if (sv.value !== ':') {
                                return spaceAsThousandSeparator(sv.value)
                            }
                        }
                    }
                })
        }

        return out
    }

    //@override
    out.getLegendConstructor = function () {
        return lgch.legend
    }

    return out
}

//build a color legend object
export const getColorLegend = function (colorFun, colorArray) {
    colorFun = colorFun || interpolateOrRd
    if (colorArray) {
        return function (ecl, clnb) {
            return colorArray[ecl]
        }
    }
    return function (ecl, clnb) {
        return colorFun(ecl / (clnb - 1))
    }
}

/**
 * Build a fill pattern legend object { nd:"white", 0:"url(#pattern_0)", 1:"url(#pattern_1)", ... }
 */
export const getFillPatternLegend = function () {
    return function (ecl) {
        return 'url(#pattern_' + ecl + ')'
    }
}
