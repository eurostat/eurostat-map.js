import * as smap from '../core/stat-map';

/**
 * Return a stripe composition map.
 * See: https://gistbok.ucgis.org/bok-topics/multivariate-mapping
 * 
 * @param {*} config 
 */
export const map = function (config) {

	//create map object to return, using the template
	const out = smap.statMap(config);

	//width of the stripes serie
	out.stripeWidth_ = 50;
	//orientation - vertical by default
	out.stripeOrientation_ = 0;

	//colors - indexed by dataset code
	out.stripeColors_ = {};
	//default color, for all categories not specified
	out.defaultStripeColor_ = "lightgray";
	//style for no data regions
	out.noDataFillStyle_ = "darkgray";

	//labels
	out.labelText_ = {};

	//specific tooltip text function
	out.tooltipText_ = (rg => { return rg.properties.na; }); //TODO show pie chart


    /**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["stripeWidth_", "stripeOrientation_", "stripeColors_", "defaultStripeColor_", "noDataFillStyle_", "labelText_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function(v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		});

	//override attribute values with config values
	if(config) ["stripeWidth", "stripeOrientation", "stripeColors", "defaultStripeColor", "noDataFillStyle", "labelText"].forEach(function (key) {
		if(config[key]!=undefined) out[key](config[key]);
	});


	/**
	 * 
	 * @param {*} stat 
	 * @param {*} dim 
	 * @param {*} dimValues 
	 */
	out.statComp = function(stat, dim, dimValues) {
		for(let i=0; i<dimValues.length; i++) {
			//TODO
		}
	}


	/**  */
	let statCodes = undefined;

	/** Function to compute composition for region id, for each category */
	const getComposition = function(id) {
		let comp = {}, sum = 0;
		for(let i=0; i<statCodes.length; i++) {
			const sc = statCodes[i]
			const s = out.statData(sc).get(id);
			if(!s || (s.value!=0 && !s.value) || isNaN(s.value)) return null;
			comp[sc] = s.value;
			sum += s.value;
		}
		if(sum == 0) return null;
		for(let i=0; i<statCodes.length; i++) comp[statCodes[i]] /= sum;
		return comp;
	}



	//@override
	out.updateClassification = function () {

		//get list of stat codes. Remove "default".
		statCodes = Object.keys(out.statData_);
		const index = statCodes.indexOf("default");
		if (index > -1) statCodes.splice(index, 1);

		return out;
	};


	//@override
	out.updateStyle = function () {

		//build and assign texture to the regions
		out.svg().selectAll("path.nutsrg")
			.transition().duration(out.transitionDuration())
			.attr("fill", function (d) {
				const id = d.properties.id;

				//compute composition
				const comp = getComposition(id);

				//case when no or missing data
				if (!comp) return out.noDataFillStyle() || "gray";

				//make stripe pattern
				const patt = out.svg().append("pattern").attr("id", "pattern_" + id).attr("x", "0").attr("y", "0")
				.attr("width", out.stripeWidth()).attr("height", 1).attr("patternUnits", "userSpaceOnUse");
				if(out.stripeOrientation()) patt.attr("patternTransform", "rotate("+out.stripeOrientation()+")")
				let x=0;
				for(let s in comp) {
					const dx = comp[s] * out.stripeWidth();
					const col = out.stripeColors()[s] || out.defaultStripeColor() || "lightgray";
					patt.append("rect").attr("x", x).attr("y", 0).attr("width", dx).attr("height", 1).style("stroke", "none").style("fill", col)
					x += dx;
				}

				//return pattern reference
				return "url(#pattern_" + id + ")"
			});


		return out;
	};

	//@override
	/*out.getLegendConstructor = function() {
		//TODO
		return lgchbi.legend;
	}*/

	return out;
}
