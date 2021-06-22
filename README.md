# eurostat-map.js

![npm bundle size](https://img.shields.io/bundlephobia/min/eurostat-map) 
![npm](https://img.shields.io/npm/v/eurostat-map)
[![Build Status](https://travis-ci.org/eurostat/eurostat-map.js.svg?branch=master)](https://travis-ci.org/eurostat/eurostat-map.js)
![license](https://img.shields.io/badge/license-EUPL-success)

Reusable library to quickly create and customise web maps based on [NUTS regions](https://ec.europa.eu/eurostat/web/nuts/background), showing [Eurostat](https://ec.europa.eu/eurostat) data directly retrieved from the [Eurostat database](https://ec.europa.eu/eurostat/data/database).

<div>
<img src="https://raw.githubusercontent.com/eurostat/eurostat-map.js/master/docs/img/previews/ch.png" href="https://eurostat.github.io/eurostat-map.js/examples/population-   density.html" target="_blank" alt="choropleth" width="450"/>
<img src="https://raw.githubusercontent.com/eurostat/eurostat-map.js/master/docs/img/previews/prop.png" href="https://eurostat.github.io/eurostat-map.js/examples/prop-circles.html" target="_blank" alt="proportional circles" width="450"/>
<img src="https://raw.githubusercontent.com/eurostat/eurostat-map.js/master/docs/img/previews/euro.png" href="https://eurostat.github.io/eurostat-map.js/examples/prop-symbols.html" target="_blank" alt="proportional symbols" width="450"/>
<img src="https://raw.githubusercontent.com/eurostat/eurostat-map.js/master/docs/img/previews/pie.png" href="https://eurostat.github.io/eurostat-map.js/examples/prop-piecharts.html" target="_blank" alt="pie charts" width="450"/>
<img src="https://raw.githubusercontent.com/eurostat/eurostat-map.js/master/docs/img/previews/stripe.png" href="https://eurostat.github.io/eurostat-map.js/examples/livestock_composition.html" target="_blank" alt="stripes" width="450"/>
<img src="https://raw.githubusercontent.com/eurostat/eurostat-map.js/master/docs/img/previews/bivar.png" href="https://eurostat.github.io/eurostat-map.js/examples/pop-unemploy-bivariate.html" target="_blank" alt="bivariate choropleth" width="450"/>
<img src="https://raw.githubusercontent.com/eurostat/eurostat-map.js/master/docs/img/previews/cat.png" href="https://eurostat.github.io/eurostat-map.js/examples/categorical.html" target="_blank" alt="categorical" width="450"/>
  <img src="https://raw.githubusercontent.com/eurostat/eurostat-map.js/master/docs/img/previews/dot.png" href="https://eurostat.github.io/eurostat-map.js/examples/population-dot-density.html" target="_blank" alt="dot density" width="450"/>
</div>

## Examples

- [Population density](https://eurostat.github.io/eurostat-map.js/examples/population-density.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/population-density.html))
- [Population density map with dot pattern](https://eurostat.github.io/eurostat-map.js/examples/population-dot-density.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/population-dot-density.html))  
- [Population map with proportional circles](https://eurostat.github.io/eurostat-map.js/examples/prop-circles.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/prop-circles.html))
- [GDP map with custom proportional symbols](https://eurostat.github.io/eurostat-map.js/examples/prop-symbols.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/prop-symbols.html))
- [Causes of death with proportional pie charts](https://eurostat.github.io/eurostat-map.js/examples/prop-piecharts.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/prop-piecharts.html))
- [Population change ](https://eurostat.github.io/eurostat-map.js/examples/population-change.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/population-change.html))
- [NUTS typology as a categorical map](https://eurostat.github.io/eurostat-map.js/examples/categorical.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/categorical.html))
- [Focus on Spain](https://eurostat.github.io/eurostat-map.js/examples/spain.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/spain.html))
- [20 years of GDP change in Europe](https://eurostat.github.io/eurostat-map.js/examples/small_multiple.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/small_multiple.html))
- [Unemployment/population relation](https://eurostat.github.io/eurostat-map.js/examples/pop-unemploy-bivariate.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/pop-unemploy-bivariate.html))
- [Farm sizes composition](https://eurostat.github.io/eurostat-map.js/examples/farm_size.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/farm_size.html))
- [Livestock composition](https://eurostat.github.io/eurostat-map.js/examples/livestock_composition.html) (see [the code](https://github.com/eurostat/eurostat-map.js/blob/master/examples/livestock_composition.html))


## Installation

- **Node.js**: With ``npm install eurostatmap`` and then ``eurostatmap = require("eurostatmap")``.
- **Standalone**: For the latest version, use ``<script src="https://unpkg.com/eurostat-map"></script>`` as shown in [the examples](#examples). For a fixed version, use ``<script src="https://unpkg.com/eurostat-map@X.Y.Z"></script>``, where *X.Y.Z* is a version number among [these ones](https://www.npmjs.com/package/eurostat-map?activeTab=versions).


## Documentation

See the **[API reference](docs/reference.md)**:
- For a [choropleth map](docs/reference.md#choropleth-map),
- For a [proportional symbol map](docs/reference.md#proportional-symbol-map),
- For a [proportional pie chart map](docs/reference.md#proportional-pie-chart-map),
- For a [categorical map](docs/reference.md#categorical-map).
- For a [bivariate choropleth map](docs/reference.md#bivariate-choropleth-map).
- For a [stripe composition map](docs/reference.md#stripe-composition-map).

Anything unclear or missing? Feel free to [ask](https://github.com/eurostat/eurostat.js/issues/new) !


## Technical details

Maps based on [NUTS regions](http://ec.europa.eu/eurostat/web/nuts/overview) rely on [Nuts2json API](https://github.com/eurostat/Nuts2json) and [TopoJSON](https://github.com/mbostock/topojson/wiki) format. Statistical data are accessed using [Eurostat REST webservice](http://ec.europa.eu/eurostat/web/json-and-unicode-web-services/getting-started/rest-request) for [JSON-stat](https://json-stat.org/) data. The data are decoded and queried using [JSON-stat library](https://json-stat.com/). Maps are rendered as SVG maps using [D3.js library](https://d3js.org/).


## About

|   |    |
| ------ | -------- |
| *contributors* | [<img src="https://github.com/jgaffuri.png" height="40" />](https://github.com/jgaffuri) [<img src="https://github.com/JoeWDavies.png" height="40" />](https://github.com/JoeWDavies) |
| *version* | See [npm](https://www.npmjs.com/package/eurostat-map?activeTab=versions) |
| *status* | Since 2018  |
| *license* | [EUPL 1.2](https://github.com/eurostat/Nuts2json/blob/master/LICENSE)    |


## Support and contribution

Feel free to [ask support](https://github.com/eurostat/eurostat.js/issues/new), fork the project or simply star it (it's always a pleasure).


## Copyright

The [Eurostat NUTS dataset](http://ec.europa.eu/eurostat/web/nuts/overview) is copyrighted. There are [specific provisions](https://ec.europa.eu/eurostat/web/gisco/geodata/reference-data/administrative-units-statistical-units) for the usage of this dataset which must be respected. The usage of these data is subject to their acceptance. See the [Eurostat-GISCO website](http://ec.europa.eu/eurostat/web/gisco/geodata/reference-data/administrative-units-statistical-units/nuts) for more information.


## Disclaimer
The designations employed and the presentation of material on these maps do not imply the expression of any opinion whatsoever on the part of the European Union concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries. Kosovo*: This designation is without prejudice to positions on status, and is in line with UNSCR 1244/1999 and the ICJ Opinion on the Kosovo declaration of independence. Palestine*: This designation shall not be construed as recognition of a State of Palestine and is without prejudice to the individual positions of the Member States on this issue.
