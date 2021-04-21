<template>
  <div id="app" >
    <p>MSE player</p>
    <div>
      <MSEPlayer schema="ws" server="localhost" :port="8090" suuid="6c31f7bd-c842-4645-89b5-427b1a5b57ff" :verbose="false" />
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
