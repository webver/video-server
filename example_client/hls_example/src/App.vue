<template>
  <div id="app" >
    <p>HLS player</p>
    <div>
      <HLSPlayer schema="http" server="localhost" :port="8090" suuid="6c31f7bd-c842-4645-89b5-427b1a5b57ff" :verbose="false" />
    </div>
  </div>
</template>


<script>
import HLSPlayer from './components/HLSPlayer.vue'

export default {
  name: 'App',
  components: {
    HLSPlayer
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
