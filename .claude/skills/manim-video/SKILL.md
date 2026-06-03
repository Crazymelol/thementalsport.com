---
name: manim-video
description: Use when creating math or explainer animations with Manim (the Python animation engine, manim/manimce), when working with Scene, Mobjects, self.play, Create/Write/Transform/FadeIn, or rendering 3blue1brown-style visualizations from Python code.
---

# Manim Video Creation

## Overview
Manim (Python) animates mathematical and conceptual visuals. You subclass `Scene`, build `Mobject`s (shapes, text, equations), and animate them by passing animation objects to `self.play()`. Render via the `manim` CLI.

## Structure
1. **Setup**: `pip install manim`. Write a class subclassing `Scene` with a `construct(self)` method.
2. **Mobjects**: Create objects: `Circle()`, `Square()`, `Text("...")`, `MathTex(r"...")`, `Axes()`. Position with `.shift()`, `.next_to()`, `.move_to()`, `.to_edge()`.
3. **Animate**: `self.play(Create(obj))`, `Write(text)`, `FadeIn/FadeOut`, `Transform(a, b)`, or `obj.animate.shift(...)`. Hold with `self.wait()`.
4. **Render**: `manim -pqh file.py SceneName` (preview, quality high). `-ql` for fast drafts.

## Code Example
```python
from manim import *

class HelloMath(Scene):
    def construct(self):
        title = Text("Pythagoras").to_edge(UP)
        eq = MathTex(r"a^2 + b^2 = c^2")
        square = Square(side_length=2, color=BLUE)

        self.play(Write(title))
        self.play(Create(square))
        self.play(square.animate.shift(LEFT * 2))
        self.play(Transform(square, eq))
        self.wait(1)
```

## Quick Reference
| Need | API |
|---|---|
| Scene base | `class X(Scene): construct(self)` |
| Text / math | `Text(...)` / `MathTex(r"...")` |
| Draw in | `Create`, `Write` |
| Fade | `FadeIn`, `FadeOut` |
| Morph A into B | `Transform(a, b)` |
| Move existing obj | `obj.animate.shift(UP)` |
| Pause | `self.wait(t)` |
| Render HQ preview | `manim -pqh file.py Scene` |

## Common Mistakes
- Adding mobjects with `self.add` when you meant to animate with `self.play`.
- Using `Transform` vs `ReplacementTransform` incorrectly (reference points to old object after Transform).
- Forgetting `self.wait()`, so the final frame flashes by.
- Raw strings missing for LaTeX (`MathTex("a^2")` should be `r"a^2"`).
- LaTeX not installed, breaking `MathTex`/`Tex`.

Keywords: manim, manimce, python animation, math animation, explainer video, Scene, Mobject, self.play, MathTex, Transform, Create, Write, 3blue1brown
