# cookapp

食谱应用项目。

## UI 参考截屏

Pestle 风格页面截屏已保存在 [`docs/ui-screenshots/`](docs/ui-screenshots/)，共 42 张，按页面命名，详见该目录下 README。

一比一还原与防漂移约束见 [`docs/DESIGN.md`](docs/DESIGN.md)：

- 唯一 token + 唯一 UI kit；屏幕只组合、不私自改样式
- 底栏、按钮、列表行、菜单等共享控件全应用同一实现
- 对照 `docs/ui-screenshots/` 侧旁验收；忽略状态栏 / 灵动岛 / 键盘
- 禁止各页私有色值/圆角/字号；有差异先改 token/组件，禁止开叉

## 开发

项目正在初始化中，后续将在此补充技术栈、安装方式和使用说明。
