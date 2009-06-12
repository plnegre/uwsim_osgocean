// osgOcean Uniforms
// -----------------
uniform float osgOcean_DOF_Near;
uniform float osgOcean_DOF_Focus;
uniform float osgOcean_DOF_Far;
uniform float osgOcean_DOF_Clamp;

uniform float osgOcean_UnderwaterFogDensity;
uniform float osgOcean_AboveWaterFogDensity;
uniform vec4  osgOcean_UnderwaterFogColor;
uniform vec4  osgOcean_AboveWaterFogColor;

uniform vec4 osgOcean_UnderwaterDiffuse;

uniform float osgOcean_WaterHeight;

uniform bool osgOcean_EnableGlare;
uniform bool osgOcean_EnableDOF;
uniform bool osgOcean_EyeUnderwater;
// -------------------

uniform sampler2D uTextureMap;

varying vec3 vNormal;
varying vec3 vLightDir;
varying vec3 vEyeVec;
varying float vWorldHeight;

float computeDepthBlur(float depth, float focus, float near, float far, float clampval )
{
   float f;
   if (depth < focus){
      f = (depth - focus)/(focus - near);
   }
   else{
      f = (depth - focus)/(far - focus);
      f = clamp(f, 0.0, clampval);
   }
   return f * 0.5 + 0.5;
}

vec4 lighting( vec4 diffuse, vec4 colormap )
{
	vec4 final_color = gl_LightSource[osgOcean_LightID].ambient * colormap;

	vec3 N = normalize(vNormal);
	vec3 L = normalize(vLightDir);

	float lambertTerm = dot(N,L);

	if(lambertTerm > 0.0)
	{
		final_color += diffuse * lambertTerm * colormap;

		vec3 E = normalize(vEyeVec);
		vec3 R = reflect(-L, N);

		float specular = pow( max(dot(R, E), 0.0), 2.0 );

		final_color += gl_LightSource[osgOcean_LightID].specular * specular;
	}

	return final_color;
}

void main(void)
{
	vec4 textureColor = texture2D( uTextureMap, gl_TexCoord[0].st );

	vec4 final_color;

	float alpha;

	// +2 tweak here as waves peak above average wave height,
	// and surface fog becomes visible.
	if(osgOcean_EyeUnderwater && vWorldHeight < osgOcean_WaterHeight+2.0 )
	{
		final_color = lighting( osgOcean_UnderwaterDiffuse, textureColor );

		float fogFactor = exp2(osgOcean_UnderwaterFogDensity * gl_FogFragCoord * gl_FogFragCoord );
		final_color = mix( osgOcean_UnderwaterFogColor, final_color, fogFactor );

		if(osgOcean_EnableDOF)
			final_color.a = computeDepthBlur(gl_FogFragCoord, osgOcean_DOF_Focus, osgOcean_DOF_Near, osgOcean_DOF_Far, osgOcean_DOF_Clamp);
	}
	else
	{
		final_color = lighting( gl_LightSource[0].diffuse, textureColor );

		float fogFactor = exp2(osgOcean_AboveWaterFogDensity * gl_FogFragCoord * gl_FogFragCoord );
		final_color = mix( osgOcean_AboveWaterFogColor, final_color, fogFactor );

		if(osgOcean_EnableGlare)
			final_color.a = 0.0;
	}

	gl_FragColor = final_color;
}
