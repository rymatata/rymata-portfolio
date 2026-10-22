// GLSL ES 3.00 (WebGL2) for the parallax net
// Both programs read dot positions from a one-row float texture that the renderer rewrites every frame

// Lines: one instance per dot pair that can ever connect, widened on the GPU into a screen-aligned quad
export const LINE_VERTEX = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aCorner;   // x: which dot (0 | 1), y: which side of the line (-1 | 1)
layout(location = 1) in uvec2 aPair;    // Per instance: the two dots' indices

uniform highp sampler2D uDots;
uniform mat4 uViewProjection;
uniform vec2 uHalfViewport;             // Half the canvas, px
uniform float uHalfWidth;               // Half the line width, px
uniform float uMaxDistance;

flat out float vFade;
out float vEdge;                        // px from the line's center

void main() {
    vec3 a = texelFetch(uDots, ivec2(int(aPair.x), 0), 0).xyz;
    vec3 b = texelFetch(uDots, ivec2(int(aPair.y), 0), 0).xyz;

    // Vanta's falloff: full strength up to half of maxDistance, then fading to nothing
    vFade = clamp(2.2 * (1.0 - distance(a, b) / uMaxDistance), 0.0, 1.0);
    vEdge = 0.0;
    if (vFade == 0.0) {
        // Disconnected: every corner lands past the far plane, so the quad is clipped before it rasterizes
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    vec4 clipA = uViewProjection * vec4(a, 1.0);
    vec4 clipB = uViewProjection * vec4(b, 1.0);
    vec2 span = (clipB.xy / clipB.w - clipA.xy / clipA.w) * uHalfViewport;
    vec2 normal = length(span) > 0.0 ? normalize(vec2(-span.y, span.x)) : vec2(0.0);

    // Half a px past the edge leaves room to anti-alias
    vEdge = aCorner.y * (uHalfWidth + 0.5);
    vec4 clip = mix(clipA, clipB, aCorner.x);
    clip.xy += normal * vEdge / uHalfViewport * clip.w;
    gl_Position = clip;
}`;

export const LINE_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec4 uColor;                    // Net color, straight alpha
uniform float uHalfWidth;

flat in float vFade;
in float vEdge;
out vec4 outColor;

void main() {
    // How much of this pixel the line covers: anti-aliasing without MSAA
    float coverage = clamp(uHalfWidth + 0.5 - abs(vEdge), 0.0, 1.0);

    // Premultiplied, as the canvas composites onto the page
    outColor = vec4(uColor.rgb, 1.0) * (uColor.a * vFade * coverage);
}`;

// Dots: point sprites shaded as tiny spheres
export const DOT_VERTEX = /* glsl */ `#version 300 es
layout(location = 0) in uint aDot;

uniform highp sampler2D uDots;
uniform mat4 uViewProjection;
uniform float uFocal;                   // px per world unit at a depth of 1
uniform float uRadius;                  // World units

flat out float vRadius;                 // px

void main() {
    gl_Position = uViewProjection * vec4(texelFetch(uDots, ivec2(int(aDot), 0), 0).xyz, 1.0);
    vRadius = uRadius * uFocal / gl_Position.w;
    
    // A px of margin on each side holds the anti-aliased rim
    gl_PointSize = 2.0 * vRadius + 2.0;
}`;

export const DOT_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec4 uColor;
uniform vec3 uLight;                    // Toward the light, view space

flat in float vRadius;
out vec4 outColor;

void main() {
    // px from the sphere's center; gl_PointCoord spans the sprite 0..1 with y pointing down
    vec2 offset = (gl_PointCoord - 0.5) * (2.0 * vRadius + 2.0) * vec2(1.0, -1.0);
    float coverage = clamp(vRadius + 0.5 - length(offset), 0.0, 1.0);
    if (coverage == 0.0) discard;

    // Lambert sphere: dot shading
    vec2 xy = offset / vRadius;
    vec3 normal = vec3(xy, sqrt(max(1.0 - dot(xy, xy), 0.0)));
    float shade = min(0.25 + 1.0 * max(dot(normal, uLight), 0.0), 1.0);

    float alpha = uColor.a * coverage;
    outColor = vec4(uColor.rgb * shade * alpha, alpha);
}`;
