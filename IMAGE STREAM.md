---
cssclasses:
  - bfv-container
---

```datacorejsx
const { View } = await dc.require(dc.resolvePath("IMAGE STREAM/src/index.jsx"));
return await View({ folderPath: dc.resolvePath("IMAGE STREAM"), dc });
```
