import * as THREE from 'three';

// Custom Gouraud vertex shader - lighting calculations in vertex shader
export const gouraudVertexShader = `
  #include <common>
  #include <uv_pars_vertex>
  #include <color_pars_vertex>
  #include <fog_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <shadowmap_pars_vertex>
  #include <logdepthbuf_pars_vertex>
  #include <clipping_planes_pars_vertex>
  
  // Lighting uniforms
  uniform vec3 directionalLightDirection;
  uniform vec3 directionalLightColor;
  uniform vec3 ambientLightColor;
  uniform float directionalIntensity;
  uniform float ambientIntensity;
  
  // Material uniforms
  uniform vec3 diffuse;
  uniform vec3 emissive;
  uniform float roughness;
  uniform float metalness;
  
  // Varying to pass interpolated color to fragment shader
  varying vec3 vLightWeighting;
  
  void main() {
    #include <uv_vertex>
    #include <color_vertex>
    #include <morphcolor_vertex>
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <worldpos_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
    
    // Transform normal to world space
    vec3 transformedNormal = normalMatrix * normal;
    vec3 worldNormal = normalize(transformedNormal);
    
    // Calculate directional light contribution
    float directionalLightWeighting = max(dot(worldNormal, normalize(-directionalLightDirection)), 0.0);
    
    // Combine lighting
    vLightWeighting = ambientLightColor * ambientIntensity + 
                      directionalLightColor * directionalIntensity * directionalLightWeighting;
  }
`;

export const gouraudFragmentShader = `
  #include <common>
  #include <color_pars_fragment>
  #include <uv_pars_fragment>
  #include <fog_pars_fragment>
  #include <shadowmap_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>
  
  uniform vec3 diffuse;
  uniform vec3 emissive;
  uniform float opacity;
  
  varying vec3 vLightWeighting;
  
  void main() {
    #include <clipping_planes_fragment>
    #include <logdepthbuf_fragment>
    
    vec4 diffuseColor = vec4(diffuse, opacity);
    
    #include <color_fragment>
    
    // Apply Gouraud lighting (interpolated from vertex shader)
    vec3 outgoingLight = emissive + diffuseColor.rgb * vLightWeighting;
    
    gl_FragColor = vec4(outgoingLight, diffuseColor.a);
    
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Enhanced Phong vertex shader
export const phongVertexShader = `
  #include <common>
  #include <uv_pars_vertex>
  #include <color_pars_vertex>
  #include <fog_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <shadowmap_pars_vertex>
  #include <logdepthbuf_pars_vertex>
  #include <clipping_planes_pars_vertex>
  
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewPosition;
  
  void main() {
    #include <uv_vertex>
    #include <color_vertex>
    #include <morphcolor_vertex>
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <worldpos_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
    
    // Pass world position and normal to fragment shader
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(normalMatrix * normal);
    vViewPosition = -mvPosition.xyz;
  }
`;

export const phongFragmentShader = `
  #include <common>
  #include <color_pars_fragment>
  #include <uv_pars_fragment>
  #include <fog_pars_fragment>
  #include <shadowmap_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>
  
  // Lighting uniforms
  uniform vec3 directionalLightDirection;
  uniform vec3 directionalLightColor;
  uniform vec3 ambientLightColor;
  uniform float directionalIntensity;
  uniform float ambientIntensity;
  
  // Material uniforms
  uniform vec3 diffuse;
  uniform vec3 emissive;
  uniform float roughness;
  uniform float metalness;
  uniform float opacity;
  
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewPosition;
  
  void main() {
    #include <clipping_planes_fragment>
    #include <logdepthbuf_fragment>
    
    vec4 diffuseColor = vec4(diffuse, opacity);
    
    #include <color_fragment>
    
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 lightDir = normalize(-directionalLightDirection);
    
    // Ambient lighting
    vec3 ambient = ambientLightColor * ambientIntensity;
    
    // Diffuse lighting (Lambertian)
    float NdotL = max(dot(normal, lightDir), 0.0);
    vec3 diffuseLight = directionalLightColor * directionalIntensity * NdotL;
    
    // Specular lighting (Phong)
    vec3 reflectDir = reflect(-lightDir, normal);
    float RdotV = max(dot(reflectDir, viewDir), 0.0);
    float shininess = 1.0 / (roughness * roughness + 0.001); // Convert roughness to shininess
    float specularStrength = mix(0.04, 1.0, metalness); // More specular for metallic materials
    vec3 specular = directionalLightColor * directionalIntensity * 
                    specularStrength * pow(RdotV, shininess);
    
    // Combine lighting
    vec3 lighting = ambient + diffuseLight + specular;
    vec3 outgoingLight = emissive + diffuseColor.rgb * lighting;
    
    gl_FragColor = vec4(outgoingLight, diffuseColor.a);
    
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Flat shading vertex shader
export const flatVertexShader = `
  #include <common>
  #include <uv_pars_vertex>
  #include <color_pars_vertex>
  #include <fog_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <shadowmap_pars_vertex>
  #include <logdepthbuf_pars_vertex>
  #include <clipping_planes_pars_vertex>
  
  varying vec3 vWorldPosition;
  
  void main() {
    #include <uv_vertex>
    #include <color_vertex>
    #include <morphcolor_vertex>
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <worldpos_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
    
    vWorldPosition = worldPosition.xyz;
  }
`;

export const flatFragmentShader = `
  #include <common>
  #include <color_pars_fragment>
  #include <uv_pars_fragment>
  #include <fog_pars_fragment>
  #include <shadowmap_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>
  
  // Lighting uniforms
  uniform vec3 directionalLightDirection;
  uniform vec3 directionalLightColor;
  uniform vec3 ambientLightColor;
  uniform float directionalIntensity;
  uniform float ambientIntensity;
  
  // Material uniforms
  uniform vec3 diffuse;
  uniform vec3 emissive;
  uniform float opacity;
  
  varying vec3 vWorldPosition;
  
  void main() {
    #include <clipping_planes_fragment>
    #include <logdepthbuf_fragment>
    
    vec4 diffuseColor = vec4(diffuse, opacity);
    
    #include <color_fragment>
    
    // Calculate face normal using derivatives (flat shading)
    vec3 fdx = dFdx(vWorldPosition);
    vec3 fdy = dFdy(vWorldPosition);
    vec3 normal = normalize(cross(fdx, fdy));
    
    vec3 lightDir = normalize(-directionalLightDirection);
    
    // Simple flat lighting
    float NdotL = max(dot(normal, lightDir), 0.0);
    vec3 lighting = ambientLightColor * ambientIntensity + 
                    directionalLightColor * directionalIntensity * NdotL;
    
    vec3 outgoingLight = emissive + diffuseColor.rgb * lighting;
    
    gl_FragColor = vec4(outgoingLight, diffuseColor.a);
    
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Create custom materials with improved shaders
export const createCustomMaterial = (
  shadingMode: 'phong' | 'gouraud' | 'flat' | 'toon',
  lightingSettings: any,
  isSelected: boolean
) => {
  const baseColor = isSelected ? 0x3b82f6 : 0xe5e7eb;
  const emissiveColor = isSelected ? 0x1e40af : 0x111827;
  const emissiveIntensity = isSelected ? 0.3 : 0.1;

  const commonUniforms = {
    diffuse: { value: new THREE.Color(baseColor) },
    emissive: { value: new THREE.Color(emissiveColor).multiplyScalar(emissiveIntensity) },
    opacity: { value: 0.9 },
    directionalLightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
    directionalLightColor: { value: new THREE.Color(0xffffff) },
    ambientLightColor: { value: new THREE.Color(0x404040) },
    directionalIntensity: { value: lightingSettings.directionalIntensity },
    ambientIntensity: { value: lightingSettings.ambientIntensity },
  };

  switch (shadingMode) {
    case 'gouraud':
      return new THREE.ShaderMaterial({
        uniforms: {
          ...commonUniforms,
          roughness: { value: lightingSettings.roughness },
          metalness: { value: lightingSettings.metalness },
        },
        vertexShader: gouraudVertexShader,
        fragmentShader: gouraudFragmentShader,
        transparent: true,
        wireframe: lightingSettings.wireframe,
      });

    case 'phong':
      return new THREE.ShaderMaterial({
        uniforms: {
          ...commonUniforms,
          roughness: { value: lightingSettings.roughness },
          metalness: { value: lightingSettings.metalness },
        },
        vertexShader: phongVertexShader,
        fragmentShader: phongFragmentShader,
        transparent: true,
        wireframe: lightingSettings.wireframe,
      });

    case 'flat':
      return new THREE.ShaderMaterial({
        uniforms: commonUniforms,
        vertexShader: flatVertexShader,
        fragmentShader: flatFragmentShader,
        transparent: true,
        wireframe: lightingSettings.wireframe,
      });

    case 'toon':
      // Use Three.js built-in toon material but with better setup
      return new THREE.MeshToonMaterial({
        color: baseColor,
        emissive: emissiveColor,
        emissiveIntensity,
        transparent: true,
        opacity: 0.9,
        wireframe: lightingSettings.wireframe,
      });

    default:
      return new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: emissiveColor,
        emissiveIntensity,
        roughness: lightingSettings.roughness,
        metalness: lightingSettings.metalness,
        transparent: true,
        opacity: 0.9,
        wireframe: lightingSettings.wireframe,
      });
  }
};