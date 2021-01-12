import { color } from "d3-color";
import { scalePow } from "d3-scale";
import * as dsc from "d3-scale-chromatic";
import * as smap from '../core/stat-map';
//import * as lgch from '../legend/legend-choropleth';

/**
 * Return a bivariate choropleth map.
 * See:
 * - https://gistbok.ucgis.org/bok-topics/multivariate-mapping
 * - http://andywoodruff.com/blog/how-to-make-a-value-by-alpha-map/ and https://bl.ocks.org/awoodruff/857b5b0bf170b236787b
 * - https://www.slideshare.net/ESRI/arcgis-extensions?next_slideshow=1
 * - https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3173776/
 * - https://stackoverflow.com/questions/52822286/d3-combine-two-colour-scales-into-one
 * 
 * @param {*} config 
 */
export const map = function (config) {

	//create map object to return, using the template
	const out = smap.statMap(config);

	//style for no data regions
	out.noDataFillStyle_ = "darkgray";
	//the classifier: a function which return a class number from a stat value.
	out.classifier_ = undefined;


    /**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["noDataFillStyle_", "classifier_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function(v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		});

	//override attribute values with config values
	if(config) ["noDataFillStyle"].forEach(function (key) {
		if(config[key]!=undefined) out[key](config[key]);
	});

	//@override
	out.updateClassification = function () {

		/*/simply return the array [0,1,2,3,...,nb-1]
		const getA = function (nb) { return [...Array(nb).keys()]; }

		//TODO: make it possible to use continuous color ramps?

		//use suitable classification type
		if (out.classifMethod_ === "quantile") {
			//https://github.com/d3/d3-scale#quantile-scales
			const domain = out.statData().getArray();
			const range = getA(out.clnb());
			out.classifier(scaleQuantile().domain(domain).range(range));
		} else if (out.classifMethod_ === "equinter") {
			//https://github.com/d3/d3-scale#quantize-scales
			const domain = out.statData().getArray();
			const range = getA(out.clnb());
			out.classifier(scaleQuantize().domain([min(domain), max(domain)]).range(range));
			if (out.makeClassifNice_) out.classifier().nice();
		} else if (out.classifMethod_ === "threshold") {
			//https://github.com/d3/d3-scale#threshold-scales
			out.clnb(out.threshold().length + 1);
			const range = getA(out.clnb());
			out.classifier(scaleThreshold().domain(out.threshold()).range(range));
		}

		//assign class to nuts regions, based on their value
		out.svg().selectAll("path.nutsrg")
			.attr("ecl", function (rg) {
				const sv = out.statData().get(rg.properties.id);
				if (!sv) return "nd";
				const v = sv.value;
				if (v != 0 && !v) return "nd";
				return +out.classifier()(+v);
			})
*/
		return out;
	};


	//@override
	out.updateStyle = function () {

		//get stat data
		const s1 = out.statData("v1");
		const s2 = out.statData("v2");

		//define bivariate scale
		const scale = scaleBivariate(
			[s1.getMin(), s1.getMax()], dsc.interpolateBlues, 0.15,
			[s2.getMin(), s2.getMax()], dsc.interpolateReds, 0.25
		);

		//apply colors
		out.svg().selectAll("path.nutsrg")
			.transition().duration(out.transitionDuration())
			.attr("fill", function (rg) {
				const sv1 = s1.getValue(rg.properties.id);
				if(!sv1) return out.noDataFillStyle_;
				const sv2 = s2.getValue(rg.properties.id);
				if(!sv2) return out.noDataFillStyle_;
				return scale(sv1, sv2)
			})
		return out;
	};


	/*/@override
	out.getLegendConstructor = function() {
		return lgch.legendChoropleth;
	}*/

	return out;
}


const scaleBivariate = function(domain1, colorFun1, exponant1, domain2, colorFun2, exponant2) {

	//make color scales
	const s1 = scalePow().exponent(exponant1).domain(domain1)
	const s2 = scalePow().exponent(exponant2).domain(domain2)

	return function(v1, v2) {

		//get rgba colors
		const col1 = colorFun1(s1(v1)), col2 = colorFun2(s2(v2));

		//get d3 color
		const c1 = color(col1), c2 = color(col2)

		//return middle color
		return "rgba("
			+ Math.round( 0.5*(c1.r+c2.r) ) + ","
			+ Math.round( 0.5*(c1.g+c2.g) ) + ","
			+ Math.round( 0.5*(c1.b+c2.b) ) + ","
			+ Math.round( 0.5*(c1.opacity+c2.opacity) )+")";
	}
  }
