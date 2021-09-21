<template>
  <div id="app" >
    <p>MSE player</p>
    <div>
      <MSEPlayer schema="ws" server="62.69.14.245" :port="3000" suuid="1166613793" login="admin" password="fulladmin" :verbose="true" />
    </div>
  </div>
</template>


<script>
import MSEPlayer from './components/MSEPlayer.vue'

export default {
  name: 'App',
  components: {
    MSEPlayer
  }
}
</script>

<style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }
</style>
