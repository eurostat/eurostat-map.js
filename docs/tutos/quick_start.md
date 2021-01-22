# How to make a map with eurostat-map.js ?

This page describes how to use eurostat-map.js to quickly create a web map from Eurostat data. No need for advanced javascript programming knowledge.

## Create a map

1. Download [this example file](eurostat_map.html).
2. Double click on it. You should see a map appearing in your web browser:

(image)

3. To modify the map, edit the **eurostat_map.html** file with a text editor such as notepad or notepad++. For that, you can either:
   - right click on the file and open it with a text editor
   - OR launch a text editor and open the file
   - OR drag and drop the file in it

You should see the short code defining the map:

```html
<svg id="map"></svg>
<script src="https://unpkg.com/eurostat-map@3.1.2"></script>
<script>
    eurostatmap.map("ch")
    .build();
</script>
``` 


Explain?

## First customisation

(Explain how to change easy parameters)

Save
F5

Show big example, with a lot of parameters changed.

Most important: select the data.

### Select the data

<TODO> explain how to find data from Eurostat data. +CSV case



## More customisation

- Describe how to go through the documentation

Different types of maps.

## Publish the map
- Explain how to insert the code snippet in a CMS


Use ``<script src="https://unpkg.com/eurostat-map@X.Y.Z"></script>``, where *X.Y.Z* is a version number among [these ones](https://www.npmjs.com/package/eurostat-map?activeTab=versions).
