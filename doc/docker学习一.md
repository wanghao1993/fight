# 前言

由于最近公司拓展业务，为了方便各种国家的统一部署，于是决定采用容器化的方案，于是开始接触Docker.

# Docker是什么？

**Docker** 使用 Google 公司推出的 Go 语言 (opens new window)进行开发实现，基于 Linux 内核的 cgroup (opens new window)，namespace (opens new window)，以及 OverlayFS (opens new window)类的 Union FS (opens new window)等技术，对进程进行封装隔离，属于 操作系统层面的虚拟化技术 (opens new window)。由于隔离的进程独立于宿主和其它的隔离的进程，因此也称其为容器。最初实现是基于 LXC (opens new window)，从 0.7 版本以后开始去除 LXC，转而使用自行开发的 libcontainer (opens new window)，从 1.11 版本开始，则进一步演进为使用 runC (opens new window)和 containerd (opens new window)。

**Docker** 在容器的基础上，进行了进一步的封装，从文件系统、网络互联到进程隔离等等，极大的简化了容器的创建和维护。使得 Docker 技术比虚拟机技术更为轻便、快捷。

下面的图片比较了 Docker 和传统虚拟化方式的不同之处。传统虚拟机技术是虚拟出一套硬件后，在其上运行一个完整操作系统，在该系统上再运行所需应用进程；而容器内的应用进程直接运行于宿主的内核，容器内没有自己的内核，而且也没有进行硬件虚拟。因此容器要比传统虚拟机更为轻便。

![对比](https://wh-blog.obs.cn-south-1.myhuaweicloud.com/blog/WX20210524-150557.png)


----

参考：
1.[Docker — 从入门到实践](https://vuepress.mirror.docker-practice.com/)