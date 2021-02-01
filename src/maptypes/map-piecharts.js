import { scaleSqrt, scaleQuantile, scaleQuantize, scaleThreshold } from "d3-scale";
import { select, arc, pie } from "d3";
import { interpolateOrRd } from "d3-scale-chromatic";
import * as smap from '../core/stat-map';
import * as lgpc from '../legend/legend-piecharts';

/**
 * Returns a proportional pie chart map.
 * 
 * @param {*} config 
 */
export const map = function (config) {

    //create map object to return, using the template
    const out = smap.statMap(config, true);

    out.pieMinRadius = 5;
    out.pieMaxRadius = 30;

    //tooltip pie chart
    out.pieChartRadius_ = 10;
    out.pieChartInnerRadius_ =1;

    //colors - indexed by category code
    out.catColors_ = undefined;
    //labels - indexed by category code
    out.catLabels_ = undefined;

    //show stripes only when data for all categories is complete.
    //Otherwise, consider the regions as being with no data at all.
    out.showOnlyWhenComplete_ = false;
    //style for no data regions
    out.noDataFillStyle_ = "darkgray";

    /**
     * Definition of getters/setters for all previously defined attributes.
     * Each method follow the same pattern:
     *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
     *  - To get the attribute value, call the method without argument.
     *  - To set the attribute value, call the same method with the new value as single argument.
    */
    ["catColors_", "catLabels_", "showOnlyWhenComplete_", "noDataFillStyle_", "pieMaxRadius_", "pieMinRadius_"]
        .forEach(function (att) {
            out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
        });

    //override attribute values with config values
    if (config) ["catColors", "catLabels", "showOnlyWhenComplete", "noDataFillStyle", "pieMaxRadius", "pieMinRadius"].forEach(function (key) {
        if (config[key] != undefined) out[key](config[key]);
    });

    /** The codes of the categories to consider for the composition. */
    let statCodes = undefined;

    /**
     * A function to define a stripe map easily, without repetition of information.
     * Only for eurobase data sources.
     * 
     * @param {*} stat A pattern for the stat data source
     * @param {String} dim The dimension of the composition.
     * @param {Array} codes The category codes of the composition
     * @param {Array} labels Optional: The labels for the category codes
     * @param {Array} colors Optional: The colors for the category
     */
    out.statComp = function (stat, dim, codes, labels, colors) {

        //add one dataset config for each category
        stat.filters = stat.filters || {};
        for (let i = 0; i < codes.length; i++) {

            //category code
            const code = codes[i]
            stat.filters[dim] = code
            const sc_ = {};
            for (let key in stat) sc_[key] = stat[key]
            sc_.filters = {};
            for (let key in stat.filters) sc_.filters[key] = stat.filters[key]
            out.stat(code, sc_)

            //if specified, retrieve and assign color
            if (colors) {
                out.catColors_ = out.catColors_ || {};
                out.catColors_[code] = colors[i];
            }
            //if specified, retrieve and assign label
            if (labels) {
                out.catLabels_ = out.catLabels_ || {};
                out.catLabels_[code] = labels[i];
            }
        }

        //set statCodes
        statCodes = codes;

        return out;
    }


    /**
     * Function to compute composition for region id, for each category.
     * Return an object with, for each category, the share [0,1] of the category.
     * @param {*} id 
     */
    const getComposition = function (id) {
        let comp = {}, sum = 0;
        //get stat value for each category. Compute the sum.
        for (let i = 0; i < statCodes.length; i++) {

            //retrieve code and stat value
            const sc = statCodes[i]
            const s = out.statData(sc).get(id);

            //case when some data is missing
            if (!s || (s.value != 0 && !s.value) || isNaN(s.value)) {
                if (out.showOnlyWhenComplete()) return undefined;
                else continue;
            }

            comp[sc] = s.value;
            sum += s.value;
        }

        //case when no data
        if (sum == 0) return undefined;

        //compute ratios
        for (let i = 0; i < statCodes.length; i++) comp[statCodes[i]] /= sum;

        return comp;
    }

    	//@override
	out.updateClassification = function () {

		//if not provided, get list of stat codes from the map stat data
		if(!statCodes) {
			//get list of stat codes.
			statCodes = Object.keys(out.statData_);
			//remove "default", if present
			const index = statCodes.indexOf("default");
			if (index > -1) statCodes.splice(index, 1);
		}

		return out;
	};

    //@override
    out.updateStyle = function () {

        //if not specified, build default color ramp
        if (!out.catColors()) {
            out.catColors({});
            for (let i = 0; i < statCodes.length; i++)
                out.catColors()[statCodes[i]] = schemeCategory10[i % 10];
        }

        //if not specified, initialise category labels
        out.catLabels_ = out.catLabels_ || {};

        //build and assign pie charts to the regions
        //collect nuts ids from g elements. TODO: find better way of getting IDs
        let nutsIds = [];
        out.svg().select("#g_ps").selectAll("g.symbol").append("g").attr("id", rg => { nutsIds.push(rg.properties.id); return "pie_" + rg.properties.id; })
        addPieChartsToMap(nutsIds);

        return out;
    };

    function addPieChartsToMap(ids) {

        ids.forEach((nutsid) => {
            //prepare data for pie chart
            const data = []
            const comp = getComposition(nutsid);
            for (const key in comp) data.push({ code: key, value: comp[key] })

            //case of regions with no data
            if (!data || data.length == 0) {
                return;
            };

            //create svg for pie chart
            const r = out.pieChartRadius_, ir = out.pieChartInnerRadius_;
            let node = select("#pie_" + nutsid);
            const svg = node.append("g")
            // .attr("viewBox", [-r, -r, 2 * r, 2 * r])
            // .attr("width", 2 * r);

            //make pie chart. See https://observablehq.com/@d3/pie-chart
            const pie_ = pie().sort(null).value(d => d.value)
            svg.append("g")
                .attr("stroke", "darkgray")
                .selectAll("path")
                .data(pie_(data))
                .join("path")
                .attr("fill", d => { return out.catColors()[d.data.code] || "lightgray" })
                .attr("d", arc().innerRadius(ir).outerRadius(r))

        })


        // data.forEach(region => {
        //     let x = projection(region.geometry.coordinates)[0];
        //     let y = projection(region.geometry.coordinates)[1];
        //     let arcs = pie(region.data);
        //     map
        //       .append('g')
        //       .attr("transform", "translate(" + x + "," + y + ")")
        //       .attr('stroke', 'white')
        //       .selectAll('path')
        //       .data(arcs)
        //       .join('path')
        //       .attr('fill', d => sectorColor(d.data.name))
        //       .attr(
        //         'd',
        //         d3
        //           .arc()
        //           .innerRadius(0)
        //           .outerRadius(radiusFunction(region.total))
        //       )
        //       .append('title')
        //       // title will not actually be visible
        //       .text(d => `${d.data.name}: ${d.data.value}`);
        //   });
    }

    //@override
    out.getLegendConstructor = function () {
        return lgpc.legend;
    }

    return out;
}

