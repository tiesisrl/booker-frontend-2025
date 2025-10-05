<script lang="ts" setup>
const router = useRouter();
</script>

<template>
  <div class="flex flex-column gap-4">
    <div class="text-center mt-4">
      <h1>COSA VUOI PRENOTARE?</h1>
    </div>
    <div class="grid mt-2">
      <div class="col-6 text-center">
        <img decoding="async" width="380" src="https://prenotatore-static.fra1.digitaloceanspaces.com/Tavolok2.jpg"
          alt="" />
        <div class="font-bold mt-5" style="min-height: 80px">
          TAVOLO ALL’INTERNO DEL PALATENDA
        </div>
        <Button label="Prenota ora" class="py-2" @click="router.push({ path: '/prenota' })" size="large" />
      </div>
      <div class="col-6 text-center">
        <img decoding="async" width="380" src="https://prenotatore-static.fra1.digitaloceanspaces.com/bigliettiok2.jpg"
          alt="" />
        <div class="font-bold mt-5" style="min-height: 80px">
          BIGLIETTO SALTA FILA PER ENTRARE PRIMA NEL PALATENDA
        </div>
        <Button label="Acquista ora" class="py-2" @click="router.push({ path: '/saltafila' })" size="large" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
