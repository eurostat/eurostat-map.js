
/**
 * Function returning a eurostat-map object.
 */
export const map = function () {


	//map type TODO - extract to specific file
	out.type_ = "ch"; //or "ps" or "ct"


	return out;
};





//build a color legend object
export const getColorLegend = function (colorFun) {
	colorFun = colorFun || interpolateYlOrRd;
	return function (ecl, clnb) { return colorFun(ecl / (clnb - 1)); }
}


