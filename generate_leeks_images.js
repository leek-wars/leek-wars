const xml2js = require('xml2js')
const fs = require('fs')
const parser = new xml2js.Parser({ attrkey: "attr", explicitArray : false })
const builder = new xml2js.Builder({ attrkey: "attr", explicitArray : false })
var colorsys = require('colorsys')


const colors = [
    { name: 'green', start: { h: 110, v: 90, s: 100, a: 100 }, end: { h: 110, v: 50, s: 100, a: 100 } },
    { name: 'blue', start: { h: 220, v: 100, s: 100, a: 100 }, end: { h: 220, v: 60, s: 100, a: 100 } },
    { name: 'yellow', start: { h: 60, v: 100, s: 100, a: 100 }, end: { h: 60, v: 60, s: 100, a: 100 } },
    { name: 'red', start: { h: 0, v: 100, s: 100, a: 100 }, end: { h: 0, v: 60, s: 100, a: 100 } },
    { name: 'orange', start: { h: 30, v: 100, s: 100, a: 100 }, end: { h: 30, v: 60, s: 100, a: 100 } },
    { name: 'magenta', start: { h: 320, v: 100, s: 100, a: 100 }, end: { h: 320, v: 60, s: 100, a: 100 } },
    { name: 'cyan', start: { h: 180, v: 100, s: 100, a: 100 }, end: { h: 180, v: 60, s: 100, a: 100 } },
    { name: 'purple', start: { h: 280, v: 100, s: 100, a: 100 }, end: { h: 280, v: 60, s: 100, a: 100 } },
    { name: 'multi', colors: [ '#00c800', '#fec608', '#007eed', '#cf0000', '#e900eb', '#00b9b9', '#ff7608', '#9e10ff', '#e3ca00', '#05cc00' ] },
    { name: 'rasta', colors: [ '#00d600', '#fee300', '#f4421f', '#00d600', '#fee300', '#f4421f', '#00d600', '#fee300', '#f4421f', '#00d600' ] },
    { name: 'white', start: { h: 0, v: 100, s: 0, a: 100 }, end: { h: 0, v: 80, s: 0, a: 100 } },
    { name: 'black', start: { h: 0, v: 20, s: 0, a: 100 }, end: { h: 0, v: 20, s: 0, a: 60 } },
    { name: 'alpha', start: { h: 110, v: 100, s: 100, a: 100 }, end: { h: 110, v: 100, s: 100, a: 100 }, body: true, global_filter: 'a', local_filter: 's', filter_def: `<filter color-interpolation-filters="sRGB" id="a">
   <feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1 0 1 0" result="r" />
 </filter>` },
    { name: 'apple', start: { h: 80, v: 100, s: 100, a: 100 }, end: { h: 80, v: 60, s: 100, a: 100 } },
    { name: 'gold', start: { h: 36, v: 100, s: 90, a: 100 }, end: { h: 36, v: 100, s: 90, a: 100 }, body: true, local_filter: 'g', filter_def: `<filter id="g" color-interpolation-filters="sRGB">
    <feGaussianBlur result="a" stdDeviation="2.1" />
    <feComposite in="SourceGraphic" in2="a" operator="arithmetic" result="b" k1="1.8" k2="0.3" k3="0.3" k4="0" />
    <feComposite in="b" in2="SourceAlpha" operator="atop" result="c" />
</filter>` },
    { name: 'pink', start: { h: 300, v: 100, s: 66, a: 100 }, end: { h: 300, v: 60, s: 66, a: 100 } },
    { name: 'grey', start: { h: 0, v: 80, s: 0, a: 100 }, end: { h: 0, v: 40, s: 0, a: 100 } },
    { name: 'turquoise', start: { h: 165, v: 100, s: 100, a: 100 }, end: { h: 165, v: 60, s: 100, a: 100 } },
    { name: 'celestial_blue', start: { h: 185, v: 100, s: 100, a: 100 }, end: { h: 205, v: 75, s: 80, a: 100 } },
    { name: 'green_fluo', start: { h: 130, v: 100, s: 100, a: 100 }, end: { h: 130, v: 60, s: 100, a: 100 } },
    { name: 'marine', start: { h: 250, v: 80, s: 100, a: 100 }, end: { h: 250, v: 50, s: 100, a: 100 } },
    { name: 'black_and_white', colors: [ '#000', '#000', '#fff', '#fff', '#000', '#000', '#fff', '#fff', '#000', '#000' ] },
    { name: 'white_and_black', colors: [ '#fff', '#fff', '#000', '#000', '#fff', '#fff', '#000', '#000', '#fff', '#fff' ] },
    { name: 'ghost', start: { h: 110, v: 100, s: 100, a: 100 }, end: { h: 110, v: 100, s: 100, a: 100 }, body: true, global_filter: 'a', local_filter: 's', filter_def: `<filter color-interpolation-filters="sRGB" id="a">
    <feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1 0 1 0" result="r" />
  </filter>` },
]

for (const size of [9, 11]) {

    let original = fs.readFileSync(`../meta/image/leek/svg/leek${size}_front.svg`, "utf8")

    for (const metal of [false, true]) {

        for (const color of colors) {
            console.log("Version", "size=" + size, color.name, "metal=" + metal)

            parser.parseString(original, function(error, result) {
                if (color.filter_def) {
                    result.svg.defs.filter = [result.svg.defs.filter]
                    parser.parseString(color.filter_def, function(error, result2) {
                        result.svg.defs.filter.push(result2.filter)
                    })
                }
                if (color.global_filter) {
                    result.svg.g.g.attr.filter = `url(#${color.global_filter})`
                }

                result.svg.g.g.path = result.svg.g.g.path.filter(c => !(c.attr.id && c.attr.id.includes('metal') && !metal))
                if (result.svg.g.g.circle)
                result.svg.g.g.circle = result.svg.g.g.circle.filter(c => !(c.attr.id && c.attr.id.includes('metal') && !metal))
                result.svg.g.g.ellipse = result.svg.g.g.ellipse.filter(c => !(c.attr.id && c.attr.id.includes('metal') && !metal))

                let total_leaves = 0
                for (const path of result.svg.g.g.path) {
                    if (path.attr.id && path.attr.id.includes('leaf')) total_leaves++
                }
                for (const path of result.svg.g.g.path) {
                    // console.log(path.attr.id)

                    if (path.attr.id && path.attr.id.includes('leaf') || (color.body && path.attr.id === 'body')) {
                        const leaf_index = parseInt(path.attr.id.replace('leaf', '')) - 1 // leaf1, leaf2 etc.
                        if (color.start) { // couleur de début et de fin
                            if (metal && (leaf_index === 2 || leaf_index === 5 || leaf_index === 8)) {
                                leaf_color = colorsys.hsv_to_hex({ h: 0, s: 0, v: 75 - leaf_index * 3 })
                            } else {
                                let ratio = 1
                                if (path.attr.id.includes('leaf')) {
                                    ratio = 1 - leaf_index / total_leaves
                                }
                                leaf_color = colorsys.hsv_to_hex(interpolate_hsv(color.start, color.end, ratio))
                                if (color.local_filter) {
                                    path.attr.filter = `url(#${color.local_filter})`
                                }
                            }
                        } else { // couleur indexée
                            leaf_color = color.colors[leaf_index]
                        }
                        path.attr.fill = leaf_color
                    }
                }

                const new_xml = builder.buildObject(result, { compact: true, spaces: 2 })
                fs.writeFileSync(`public/image/leeksvg/leek${size}_front_${color.name}${metal ? '_metal' : ''}.svg`, new_xml)
            })
        }
    }
}

function interpolate_hsv(color1, color2, ratio) {
    return {
        h: color1.h * ratio + color2.h * (1 - ratio),
        s: color1.s * ratio + color2.s * (1 - ratio),
        v: color1.v * ratio + color2.v * (1 - ratio),
    }
}