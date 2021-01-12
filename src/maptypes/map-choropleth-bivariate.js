import { select } from "d3-selection";
//import { min, max } from "d3-array";
import { scaleQuantile, scaleQuantize, scaleThreshold } from "d3-scale";
//import { interpolateYlOrBr } from "d3-scale-chromatic";
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

	/*/the number of classes
	out.clnb_ = 7;
	//the classification method
	out.classifMethod_ = "quantile"; // or: equinter, threshold
	//the threshold, when the classificatio method is 'threshold'
	out.threshold_ = [0];
	//when computed automatically, ensure the threshold are nice rounded values
	out.makeClassifNice_ = true;
	//the color function [0,1] -> color
	out.colorFun_ = interpolateYlOrBr;
	//a function returning the color from the class i
	out.classToFillStyle_ = undefined;*/
	//style for no data regions
	out.noDataFillStyle_ = "darkgray";
	/*/the classifier: a function which return a class number from a stat value.
	out.classifier_ = undefined;
*/

    /**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	/*["clnb_", "classifMethod_", "threshold_", "makeClassifNice_", "colorFun_", "classToFillStyle_", "noDataFillStyle_", "classifier_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function(v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		});*/

	//override of some special getters/setters
	//out.colorFun = function (v) { if (!arguments.length) return out.colorFun_; out.colorFun_ = v; out.classToFillStyle_ = getColorLegend(out.colorFun_); return out; };
	//out.threshold = function (v) { if (!arguments.length) return out.threshold_; out.threshold_ = v; out.clnb(v.length + 1); return out; };

	//override attribute values with config values
	//if(config) ["clnb","classifMethod","threshold","makeClassifNice","colorFun","classToFillStyle","noDataFillStyle"].forEach(function (key) {
	//	if(config[key]!=undefined) out[key](config[key]);
	//});

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

		/*const colorScale = scaleQuantile()
		.domain(out.statData("v2").getArray())
		.range( [ "#ca0020", "#f4a582", "#92c5de", "#0571b0" ] );

		var grayScale = scaleQuantile()
		.domain(out.statData("v1").getArray())
		.range( [ .15, .30, .60, .90, 1 ] );*/

		const scale = scaleBivariate(out.statData("v1").getArray(), out.statData("v2").getArray());

		out.svg().selectAll("path.nutsrg")
			//.attr("fill-opacity", 1)
			.transition().duration(out.transitionDuration())
			.attr("fill", function (rg) {
				const sv1 = out.statData("v2").getValue(rg.properties.id);
				if(!sv1) return out.noDataFillStyle_;
				const sv2 = out.statData("v2").getValue(rg.properties.id);
				if(!sv2) return out.noDataFillStyle_;
				return scale(sv1, sv2)
			})
			/*.transition().duration(out.transitionDuration())
			.attr("fill-opacity", function (rg) {
				const sv = out.statData("v1").getValue(rg.properties.id);
				if(!sv) return out.noDataFillStyle_;
				return grayScale(sv)
			})*/
		return out;
	};


	/*/@override
	out.getLegendConstructor = function() {
		return lgch.legendChoropleth;
	}*/

	return out;
}


const scaleBivariate = function(dom1, dom2) {
	function scaleBivariate(v1, v2) {
	  var r = reds(v1);
	  var b = blues(v2);
  	  return "rgb("+r+","+((r+b)/2)+","+b+")";
	}
  
	var blues = scaleQuantile()
	.domain(dom1)
	.range([255,205,155,105,55])
  
	var reds = scaleQuantile()
	.domain(dom2)
	.range([255,205,155,105,55])
  
	return scaleBivariate;
  }
