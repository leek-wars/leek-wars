import Matter, { Bodies, Common, Composite, Composites, Engine, Mouse, MouseConstraint, Render, Runner, Vector, World } from 'matter-js'

export class MatterWorld {

    static world: World

    static run() {

        // create engine
        var engine = Engine.create()
        MatterWorld.world = engine.world;

        // create renderer
        var render = Render.create({
            element: document.getElementById('matter')!,
            engine: engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                showAngleIndicator: false,
                background: 'transparent',
                wireframeBackground: 'transparent',
                wireframes: false,
            }
        });

        Render.run(render);

        // create runner
        var runner = Runner.create();
        Runner.run(runner, engine);

        Composite.add(MatterWorld.world, [
            // walls
            Bodies.rectangle(window.innerWidth / 2, -25, window.innerWidth, 50, { isStatic: true }),
            Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 25, window.innerWidth, 50, { isStatic: true }),
            Bodies.rectangle(window.innerWidth + 25, window.innerHeight / 2, 50, window.innerHeight, { isStatic: true }),
            Bodies.rectangle(-25, window.innerHeight / 2, 50, window.innerHeight, { isStatic: true })
        ]);

        // add mouse control
        var mouse = Mouse.create(render.canvas),
            mouseConstraint = MouseConstraint.create(engine, {
                mouse: mouse,
                constraint: {
                    stiffness: 0.2,
                    render: {
                        visible: false
                    }
                }
            });

        Composite.add(MatterWorld.world, mouseConstraint);

        // keep the mouse in sync with rendering
        render.mouse = mouse;

        // fit the render viewport to the scene
        Render.lookAt(render, {
            min: { x: 0, y: 0 },
            max: { x: window.innerWidth, y: window.innerHeight }
        });

        // run the renderer
        // Render.run(render);

        // create runner
        var runner = Runner.create();

        // run the engine
        // Runner.run(runner, engine);

        var canvas = document.getElementById('matter')!.getElementsByTagName('canvas')[0]!
        var ctx = canvas.getContext('2d')!
        // console.log("canvas", canvas)
        
        const r = () => {
            Engine.update(engine, 16);
            
            var bodies = Composite.allBodies(engine.world);
            for (var i = 0; i < bodies.length; i++) {
                const body = bodies[i]
                const image = (body as any).image

                if (image) {
                    // console.log(body.image, body.position.x, body.position.y)
                    const width = image.width
                    const height = image.height
                    ctx.save()
                    ctx.translate(body.position.x, body.position.y)
                    ctx.rotate(body.angle)
                    ctx.drawImage((body as any).image, - width / 2, - height / 2)
                    ctx.restore()
                }
            }
            window.requestAnimationFrame(r);
        }
        window.requestAnimationFrame(r);
    }

    static addObject(vertices: any, x: number, y: number, texture: HTMLImageElement) {
        // console.log("addObject", vertices)

        const vert = [] as Vector[]
        for (const v of vertices) {
            vert.push(Vector.create(v[0], v[1]))
        }

        const obj = Bodies.fromVertices(x, y, [vert], {
            render: {
                fillStyle: '#0000',
                strokeStyle: '#0000',
            }
        })

        // console.log(obj)
        ;(obj as any).image = texture

        Composite.add(MatterWorld.world, obj)

        // console.log(this.world)
    }
}

