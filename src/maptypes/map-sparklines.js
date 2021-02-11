import { select, scaleLinear, scaleLog, line, extent, area, min } from "d3";
import * as smap from '../core/stat-map';
import * as lgch from '../legend/legend-choropleth';

/**
 * Returns a chroropleth map.
 * 
 * @param {*} config 
 */
export const map = function (config) {

    //create map object to return, using the template
    const out = smap.statMap(config, true);

    out.sparkLineColor_ = "blue"
    out.sparklineWidth_ = 25;
    out.sparkLineHeight_ = 30;
    out.sparkType_ = "line";

    //show sparklines only when data for all dates is complete.
    //Otherwise, consider the regions as being with no data at all.
    out.showOnlyWhenComplete_ = false;

    out.statSpark_ = null
    out.sparkHeightClassifier_ = null;

    /**
     * Definition of getters/setters for all previously defined attributes.
     * Each method follow the same pattern:
     *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
     *  - To get the attribute value, call the method without argument.
     *  - To set the attribute value, call the same method with the new value as single argument.
    */
    ["sparkLineColor_","showOnlyWhenComplete_"]
        .forEach(function (att) {
            out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
        });

    //override attribute values with config values
    if (config) ["sparkLineColor","showOnlyWhenComplete"].forEach(function (key) {
        if (config[key] != undefined) out[key](config[key]);
    });

    /**
 * A function to define a sparkline map easily, without repetition of information.
 * Only for eurobase data sources.
 * 
 * @param {*} stat A pattern for the stat data source
 * @param {Array} dates The dates of the composition (time parameter)
 * @param {Array} labels Optional: The labels for the dates
 */
    out.statSpark = function (stat, dates, labels) {

        //add one dataset config for each category
        stat.filters = stat.filters || {};
        for (let i = 0; i < dates.length; i++) {

            //category code
            const date = dates[i]
            stat.filters.time = date
            const sc_ = {};
            for (let key in stat) sc_[key] = stat[key]
            sc_.filters = {};
            for (let key in stat.filters) sc_.filters[key] = stat.filters[key]
            out.stat(date, sc_)

            //if specified, retrieve and assign label
            if (labels) {
                out.catLabels_ = out.catLabels_ || {};
                out.catLabels_[date] = labels[i];
            }
        }

        //set statCodes
        statDates = dates;

        return out;
    }

    /** The codes of the categories to consider for the composition. */
    let statDates = undefined;

        /**
     * Function to compute composition for region id, for each date.
     * Return an object with, for each date, its statistical value for the region
     * @param {*} id 
     * @returns [{date,value}]
     */
        const getComposition = function (id) {
            let comp = [], sum = 0;
            //get stat value for each category. Compute the sum.
            for (let i = 0; i < statDates.length; i++) {
    
                //retrieve code and stat value
                const date = statDates[i]
                const s = out.statData(date).get(id);
    
                //case when some data is missing
                if (!s || (s.value != 0 && !s.value) || isNaN(s.value)) {
                    if (out.showOnlyWhenComplete()) return undefined;
                    else continue;
                }
                comp.push({date:date, value:s.value})
                sum += s.value;
            }
    
            //case when no data
            if (sum == 0) return undefined;
    
            return comp;
        }

    //@override
    out.updateClassification = function () {
        //if not provided, get list of stat codes from the map stat data
        if (!statDates) {
            //get list of stat codes.
            statDates = Object.keys(out.statData_);
            //remove "default", if present
            const index = statDates.indexOf("default");
            if (index > -1) statDates.splice(index, 1);
        }

        // //define size scaling function
        // let domain = getDatasetMaxMin();
        // out.sparkHeightClassifier_ = scaleLog().domain(domain).range([0, out.sparkLineHeight_])

        return out;
    };


    //@override
    out.updateStyle = function () {

        //define X scale
        // const xScale = scaleLinear()
        // .domain(statDates)
        // .range([0, out.sparklineWidth_]);

        const xScale = scaleLinear().domain([0, statDates.length - 1]).range([0.5, out.sparklineWidth_ - 0.5]);
        
        //const area = d3.area().x((d, i) => x(i)).y1(y).y0(y(d3.min(values)));
        //return area(values);
        

        //build and assign sparklines to the regions
        out.svg().select("#g_ps").selectAll("g.symbol")
            .append("g")
            .attr('class', 'spark-container')
            .append('path')
            .attr('class', 'sparks')
            .attr('fill', 'steelblue')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 1)
            .attr('opacity', 0.9)
            .attr('d', d => {
                let values = getComposition(d.properties.id);
                return sparkline(values, xScale)
            });
        return out;
    };

    function sparkline(values,xScale) {
        // adapted from https://beta.observablehq.com/@dankeemahill/texas-county-population-estimates
        //const yScale = scaleLinear().domain(extent(values.map(v=>v.value))).range([0, out.sparkLineHeight_])
        let ext = extent(values.map(v=>v.value))
        const yScale = scaleLinear().domain(ext).range([out.sparkLineHeight_ - 0.5, 0.5]);

        //lines
        if (out.sparkType_ == "line") {
            const lineFun = line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d.value))
            .defined(d => d.value >= 0)
            return lineFun(values);
        }

        //areas
        if (out.sparkType_ == "area") {
            const sparklineArea =
            area()
            .x((d, i) => xScale(i))
            .y1(d => yScale(d.value))
            .y0( d => {
                let m = min(values.map(v=>v.value))
                let y0 = yScale(m);
                return y0;
            });
            return sparklineArea(values);
        }
    }

        /**
    * @function getDatasetMaxMin
    * @description gets the maximum and minimum values of all dates for each region. Used to define the domain of the sparkline Y axis.
    * @returns [min,max]
    */
   function getDatasetMaxMin() {

    let maxs = [];
    let sel = out.svg().selectAll("#g_ps").selectAll("g.symbol").data();

    sel.forEach((rg) => {
        let id = rg.properties.id;
        let max = getRegionMax(id);
        if (max) {
            maxs.push(max);
        }
    })

    let minmax = extent(maxs);
    return minmax;
}

/**
* Get absolute total value of combined statistical values for a specific region. E.g total livestock
* @param {*} id nuts region id
*/
const getRegionMax = function (id) {
    let max = 0;
    let s;

    //get stat value for each date and find the max
    for (let i = 0; i < statDates.length; i++) {
        //retrieve code and stat value
        const sc = statDates[i]
        s = out.statData(sc).get(id);
        //case when some data is missing
        if (!s || (s.value != 0 && !s.value) || isNaN(s.value)) {
            if (out.showOnlyWhenComplete()) return undefined;
            else continue;
        }
        if (s.value > max) max = s.value;
    }

    //case when no data
    if (max == 0) return undefined;
    return max;
}


    //@override
    out.getLegendConstructor = function () {
        return lgch.legend;
    }

    return out;
}


//build a color legend object
export const getColorLegend = function (colorFun) {
    colorFun = colorFun || interpolateYlOrRd;
    return function (ecl, clnb) { return colorFun(ecl / (clnb - 1)); }
}
