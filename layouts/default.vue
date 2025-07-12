<script lang="ts" setup>
useHead({
  title: "Oktoberfest Calabria",
  meta: [
    {
      name: "description",
      content: "Oktoberfest Calabria",
    },
    {
      name: "viewport",
      content:
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
    },
  ],
});

const showNavbar = ref(false);
const navbar = ref(null);

function logScroll() {
  // console.log("w", window.scrollY);

  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    showNavbar.value = true;
  } else {
    showNavbar.value = false;
  }
}

onMounted(() => {
  window.addEventListener("scroll", logScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", logScroll);
});
</script>

<template>
  <div class="relative bg-grayx-100 h-full">
    <Toast />

    <div id="header"></div>
    <!-- <TheHeader /> -->

    <!-- <TheTopBar /> -->

    <div id="navbar" class="fixed block w-full z-5" :style="{
      top: showNavbar ? 0 : '-90px',
    }">
      <div id="navbar-content"></div>
    </div>
    <main>
      <div class="main flex flex-column flex-initial w-full mx-auto ">
        <slot />
      </div>
    </main>

    <div class="footer text-sm text-center py-2">
      <footer>
        {{ new Date().getFullYear() }} 2024 All Rights Reserved ALIWEST SRL®
        P.I. 03679190789
        <div class="text-xs text-center pt-1">
          <a href="https://www.oktoberfestcalabria.com/dichiarazione-sulla-privacy-ue/" target="_blank">Privacy
            Policy</a>
          e
          <a href="https://oktoberfestcalabria.com/termini-e-condizioni/" target="_blank">Termini e condizioni</a>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
body {
  margin: 0;
  background-color: #F5F5F5 !important;
}

#navbar {
  transition: top 0.3s;
  min-height: 64px;
}
</style>
